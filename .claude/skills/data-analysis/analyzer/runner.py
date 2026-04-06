"""
runner.py — 분석 실행 엔진

활성 전략을 로드하고, 유니버스 종목에 대해
기술적 지표 계산 → 팩터 스코어링 → 시그널 판정 → DB 저장.
+ public.stock_scores UPSERT 동기화
+ public.ranking_history INSERT
"""

from __future__ import annotations

import json
import math
import time
from datetime import date, datetime
from typing import Any

import pandas as pd


def _sanitize(obj: Any) -> Any:
    """NaN/Inf를 None으로 변환하여 JSON 직렬화 안전하게."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj

from .base import AnalysisContext
from .indicators import TechnicalIndicators
from .ml_predictor import MLPredictor
from .scoring import StrategyScorer, ScoreResult


class AnalysisRunner:
    """전략 기반 분석 실행기."""

    def __init__(self, ctx: AnalysisContext | None = None):
        self.ctx = ctx or AnalysisContext()
        self.scorer: StrategyScorer | None = None
        self.predictor: MLPredictor = MLPredictor()
        self.run_id: int | None = None

    def run(self, run_date: date | None = None) -> list[ScoreResult]:
        """분석 전체 파이프라인 실행."""
        run_date = run_date or date.today()
        started = time.time()

        # 1. 데이터 로드
        self.ctx.load_all()
        strategy = self.ctx.strategy
        self.scorer = StrategyScorer(strategy.get("params", {}))

        # 2. 분석 실행 레코드 생성
        self.run_id = self._create_run(strategy["id"], run_date)

        try:
            # 3. ML 모델 로드/재학습 (주간)
            self._ensure_ml_model()

            # 4. 종목별 분석
            results: list[ScoreResult] = []
            codes = self.ctx.universe["stock_code"].tolist()

            for code in codes:
                result = self._analyze_stock(code)
                if result:
                    results.append(result)

            # 4. 순위 매기기
            results = self.scorer.rank_results(results)

            # 5. trading.strategy_signals 저장
            self._save_signals(results, run_date)

            # 6. public.stock_scores UPSERT (대시보드용)
            self._sync_public_scores(results)

            # 7. public.ranking_history INSERT (순위 이력)
            self._sync_ranking_history(results, run_date)

            # 8. 실행 완료 기록
            elapsed = round(time.time() - started, 2)
            self._finish_run(
                status="success",
                stocks_analyzed=len(codes),
                signals_generated=len(results),
                metadata={"elapsed_seconds": elapsed, "strategy_version": strategy.get("version")},
            )

            return results

        except Exception as e:
            self._finish_run(status="failed", error_message=str(e))
            raise

    # 최소 OHLCV 일수 (MA60 계산 가능 기준)
    MIN_OHLCV_DAYS = 60

    def _analyze_stock(self, stock_code: str) -> ScoreResult | None:
        """종목 1개 분석: 지표 계산 → 스코어링."""
        # OHLCV 지표 계산
        ohlcv = self.ctx.ohlcv.get(stock_code)
        if ohlcv is None or ohlcv.empty:
            return None
        if len(ohlcv) < self.MIN_OHLCV_DAYS:
            return None  # 데이터 부족 → 스킵 (NaN 원천 차단)

        ohlcv = TechnicalIndicators.compute_all(ohlcv.copy())
        indicators = TechnicalIndicators.snapshot(ohlcv)

        # 펀더멘털 데이터
        fund_row = self.ctx.fundamentals[
            self.ctx.fundamentals["stock_code"] == stock_code
        ]
        fundamentals = fund_row.iloc[0].to_dict() if not fund_row.empty else {}

        # 52주 위치 추가
        if fundamentals.get("week52_high") and fundamentals.get("week52_low"):
            indicators["week52_pos"] = TechnicalIndicators.week52_position(
                ohlcv, indicators.get("close", 0),
                fundamentals["week52_high"], fundamentals["week52_low"],
            )

        # Layer 3: ML 예측 확률 (모델 없으면 None → 0.5 폴백)
        ml_prob = self.predictor.predict(ohlcv, fundamentals)

        # 스코어링
        result = self.scorer.score_stock(
            stock_code=stock_code,
            indicators=indicators,
            fundamentals=fundamentals,
            financials=self.ctx.financials,
            disclosures=self.ctx.disclosures,
            ml_prob=ml_prob,
        )

        # 지표 스냅샷 저장용
        result.score_detail["_indicators"] = indicators
        return result

    # ── ML 모델 관리 ──

    def _ensure_ml_model(self) -> None:
        """ML 모델 로드. 없거나 7일 이상 경과 시 재학습."""
        self.predictor.load_model()
        if self.predictor.needs_retrain():
            try:
                meta = self.predictor.train(
                    ohlcv_dict=self.ctx.ohlcv,
                    fundamentals_df=self.ctx.fundamentals,
                )
                print(f"ML 모델 재학습 완료: accuracy={meta['cv_accuracy_mean']:.3f} "
                      f"(±{meta['cv_accuracy_std']:.3f}), samples={meta['n_samples']}")
            except ValueError as e:
                print(f"ML 모델 학습 스킵: {e} (폴백: ml_prob=0.5)")

    # ── trading 스키마 저장 ──

    def _create_run(self, strategy_id: int, run_date: date) -> int:
        """analysis_runs 레코드 생성, id 반환."""
        resp = (
            self.ctx.client.schema("trading")
            .table("analysis_runs")
            .insert({
                "strategy_id": strategy_id,
                "run_date": run_date.isoformat(),
                "status": "started",
            })
            .execute()
        )
        return resp.data[0]["id"]

    def _finish_run(self, status: str, stocks_analyzed: int = 0,
                    signals_generated: int = 0,
                    metadata: dict | None = None,
                    error_message: str | None = None) -> None:
        """analysis_runs 상태 업데이트."""
        update = {
            "status": status,
            "stocks_analyzed": stocks_analyzed,
            "signals_generated": signals_generated,
            "metadata": json.dumps(metadata or {}),
            "finished_at": datetime.now().isoformat(),
        }
        if error_message:
            update["error_message"] = error_message

        (
            self.ctx.client.schema("trading")
            .table("analysis_runs")
            .update(update)
            .eq("id", self.run_id)
            .execute()
        )

    def _save_signals(self, results: list[ScoreResult], signal_date: date) -> None:
        """trading.strategy_signals 일괄 저장."""
        strategy_id = self.ctx.strategy["id"]
        rows = []
        for r in results:
            indicators = r.score_detail.pop("_indicators", {})
            rows.append({
                "run_id": self.run_id,
                "strategy_id": strategy_id,
                "stock_code": r.stock_code,
                "signal_date": signal_date.isoformat(),
                "signal": r.signal,
                "total_score": r.total_score,
                "score_detail": json.dumps(_sanitize(r.score_detail)),
                "indicators": json.dumps(_sanitize(indicators)),
                "rank": r.rank,
            })

        # 중복 stock_code 제거 (같은 run_id 내)
        seen = set()
        unique_rows = []
        for row in rows:
            if row["stock_code"] not in seen:
                seen.add(row["stock_code"])
                unique_rows.append(row)

        if unique_rows:
            (
                self.ctx.client.schema("trading")
                .table("strategy_signals")
                .upsert(unique_rows, on_conflict="run_id,stock_code")
                .execute()
            )

    # ── public 스키마 동기화 ──

    def _sync_public_scores(self, results: list[ScoreResult]) -> None:
        """public.stock_scores UPSERT. 대시보드에서 바로 조회 가능."""
        # public.stocks에 존재하는 종목만 필터 (FK 제약)
        resp = self.ctx.client.table("stocks").select("id").execute()
        valid_ids = {row["id"] for row in (resp.data or [])}

        rows = []
        for r in results:
            if r.stock_code not in valid_ids:
                continue
            mapped = self.scorer.to_public_scores(r)
            mapped["scored_at"] = datetime.now().isoformat()
            rows.append(mapped)

        if not rows:
            return

        # stock_id 기준 delete → insert
        stock_ids = [row["stock_id"] for row in rows]
        (
            self.ctx.client
            .table("stock_scores")
            .delete()
            .in_("stock_id", stock_ids)
            .execute()
        )
        (
            self.ctx.client
            .table("stock_scores")
            .insert(rows)
            .execute()
        )

    def _sync_ranking_history(self, results: list[ScoreResult],
                              run_date: date) -> None:
        """public.ranking_history INSERT. 일별 순위 스냅샷."""
        # public.stocks에 존재하는 종목만 (FK 제약)
        resp = self.ctx.client.table("stocks").select("id").execute()
        valid_ids = {row["id"] for row in (resp.data or [])}

        rows = [
            {
                "stock_id": r.stock_code,
                "rank_date": run_date.isoformat(),
                "rank": r.rank,
                "total_score": int(r.total_score),
            }
            for r in results
            if r.stock_code in valid_ids
        ]
        if rows:
            (
                self.ctx.client
                .table("ranking_history")
                .upsert(rows, on_conflict="stock_id,rank_date")
                .execute()
            )


def main():
    """CLI 실행 진입점."""
    import sys

    run_date = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    runner = AnalysisRunner()
    results = runner.run(run_date)

    print(f"\n{'='*60}")
    print(f"분석 완료: {len(results)}종목 | 기준일: {run_date}")
    print(f"{'='*60}")
    print(f"{'순위':>4} {'종목코드':>8} {'시그널':>12} {'점수':>6}")
    print(f"{'-'*40}")
    for r in results[:20]:
        print(f"{r.rank:>4} {r.stock_code:>8} {r.signal:>12} {r.total_score:>6.1f}")
    print(f"\npublic.stock_scores 동기화 완료")
    print(f"public.ranking_history 동기화 완료")


if __name__ == "__main__":
    main()
