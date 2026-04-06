"""
scoring.py — 동적 가중치 기반 팩터 스코어링

보고서 1+2 통합. 3-Layer 구조:
  Layer 1 (팩터): 밸류 + 퀄리티 + 이벤트 → 종목 품질 점수
  Layer 2 (타이밍): RSI, MACD, BB, 이격도, MA크로스 → 매매 타이밍 점수
  Layer 3 (ML): XGBoost 예측 확률 → 방향성 확신도

최종: Score_t = Σ w_i(t) × Normalize(Factor_i(t)) × 100
      w_i(t) = 동적 가중치 (IC가중 + 레짐스위칭 하이브리드)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd

from .normalizers import normalize_indicator, min_max, percentile_rank


@dataclass
class ScoreResult:
    """종목 1개의 스코어링 결과."""
    stock_code: str
    total_score: float
    signal: str
    score_detail: dict[str, float]
    rank: int = 0


class StrategyScorer:
    """동적 가중치 기반 3-Layer 스코어러."""

    DEFAULT_THRESHOLDS = {
        "strong_buy": 85, "buy": 65, "hold": 45, "sell": 25,
    }

    def __init__(self, params: dict[str, Any]):
        self.factors = params.get("factors", {})
        self.thresholds = params.get("signal_thresholds", self.DEFAULT_THRESHOLDS)
        self.weights = params.get("weights", {
            "factor": 0.3, "timing": 0.3, "ml": 0.4,
        })

    # ── Layer 1: 팩터 스코어 (종목 품질) ──

    def factor_score(self, fundamentals: dict, financials: pd.DataFrame,
                     disclosures: pd.DataFrame, stock_code: str) -> dict[str, float]:
        """Layer 1 서브팩터별 정규화된 점수 산출."""
        scores: dict[str, float] = {}

        # 밸류: PER (역수 정규화 — 낮을수록 고점)
        per = fundamentals.get("per")
        if per is not None and per > 0:
            scores["per"] = float(1.0 / per)  # 정규화는 유니버스 단위에서
        else:
            scores["per"] = 0.0

        # 밸류: PBR (역수 정규화)
        pbr = fundamentals.get("pbr")
        if pbr is not None and pbr > 0:
            scores["pbr"] = float(1.0 / pbr)
        else:
            scores["pbr"] = 0.0

        # 퀄리티: ROE (높을수록 고점)
        roe = fundamentals.get("roe")
        scores["roe"] = float(roe) if roe is not None else 0.0

        # 퀄리티: 매출성장률 YoY
        scores["revenue_growth"] = self._revenue_growth(financials, stock_code)

        # 이벤트: 공시유형별 점수
        scores["event"] = self._event_score(disclosures, stock_code)

        return scores

    def _revenue_growth(self, financials: pd.DataFrame, stock_code: str) -> float:
        """재무제표에서 매출 YoY 성장률 추출."""
        if financials.empty:
            return 0.0
        revenue = financials[
            (financials["stock_code"] == stock_code) &
            (financials["account_id"].str.contains(
                "revenue|ifrs-full_Revenue", case=False, na=False))
        ].sort_values("bsns_year", ascending=False)

        if len(revenue) >= 2:
            cur = revenue.iloc[0].get("current_amount", 0) or 0
            prev = revenue.iloc[1].get("current_amount", 0) or 0
            if prev > 0:
                return ((cur - prev) / abs(prev)) * 100
        return 0.0

    def _event_score(self, disclosures: pd.DataFrame, stock_code: str) -> float:
        """공시 유형별 이벤트 점수 (기준 50점)."""
        if disclosures.empty:
            return 50.0
        stock_disc = disclosures[disclosures["stock_code"] == stock_code]
        if stock_disc.empty:
            return 50.0

        type_scores = {
            "earnings": 15, "buyback": 20, "dividend": 15,
            "ownership": -5, "capital": -10, "etc": 0,
        }
        bonus = sum(
            type_scores.get(row.get("disclosure_type", "etc"), 0)
            for _, row in stock_disc.iterrows()
        )
        return float(np.clip(50 + bonus, 0, 100))

    # ── Layer 2: 타이밍 스코어 (기술적 지표) ──

    def timing_score(self, indicators: dict) -> dict[str, float]:
        """Layer 2 기술적 지표별 raw 점수 산출."""
        scores: dict[str, float] = {}

        # RSI14: 과매도 = 매수기회 (sigmoid 정규화 대상)
        rsi = indicators.get("rsi14")
        if rsi is not None:
            # RSI를 반전: 낮을수록(과매도) 고점수
            scores["rsi14"] = 100 - rsi
        else:
            scores["rsi14"] = 50.0

        # MACD 히스토그램: 양수 = 상승 모멘텀
        macd_hist = indicators.get("macd_hist")
        scores["macd_hist"] = float(macd_hist) if macd_hist is not None else 0.0

        # 볼린저밴드 위치: (close - bb_lower) / (bb_upper - bb_lower)
        bb_upper = indicators.get("bb_upper")
        bb_lower = indicators.get("bb_lower")
        close = indicators.get("close")
        if bb_upper and bb_lower and close and bb_upper != bb_lower:
            # 반전: 하단 근접(과매도) = 고점수
            scores["bb_position"] = 1.0 - (close - bb_lower) / (bb_upper - bb_lower)
        else:
            scores["bb_position"] = 0.5

        # 이격도: MA20 대비 위치 (낮을수록 평균회귀 매수)
        disparity = indicators.get("disparity20")
        if disparity is not None:
            scores["disparity"] = 100 - disparity  # 반전
        else:
            scores["disparity"] = 0.0

        # MA 크로스: 종가 > MA20 → 상승추세
        ma20 = indicators.get("ma20")
        ma60 = indicators.get("ma60")
        if close and ma20:
            cross_score = 1.0 if close > ma20 else 0.0
            if ma20 and ma60:
                cross_score += 1.0 if ma20 > ma60 else 0.0
                cross_score /= 2.0
            scores["ma_cross"] = cross_score
        else:
            scores["ma_cross"] = 0.5

        return scores

    # ── 종합 스코어링 ──

    def score_stock(
        self,
        stock_code: str,
        indicators: dict,
        fundamentals: dict,
        financials: pd.DataFrame,
        disclosures: pd.DataFrame,
        ml_prob: float | None = None,
    ) -> ScoreResult:
        """종목 1개의 동적 종합 스코어 계산.

        Score = w_factor × Norm(Factor) + w_timing × Norm(Timing) + w_ml × ML_Prob × 100
        """
        detail: dict[str, float] = {}

        # Layer 1: 팩터 점수
        factor_raw = self.factor_score(fundamentals, financials, disclosures, stock_code)
        # 유니버스 단위 정규화는 rank_results에서 수행 → 여기선 raw 저장
        vals = [v for v in factor_raw.values() if not (isinstance(v, float) and np.isnan(v))]
        factor_avg = float(np.mean(vals)) if vals else 50.0
        detail["factor_raw"] = factor_avg
        detail.update({f"f_{k}": v for k, v in factor_raw.items()})

        # Layer 2: 타이밍 점수
        timing_raw = self.timing_score(indicators)
        tvals = [v for v in timing_raw.values() if not (isinstance(v, float) and np.isnan(v))]
        timing_avg = float(np.mean(tvals)) if tvals else 50.0
        detail["timing_raw"] = timing_avg
        detail.update({f"t_{k}": v for k, v in timing_raw.items()})

        # Layer 3: ML 예측 확률 (없으면 중립 0.5)
        ml_probability = ml_prob if ml_prob is not None else 0.5
        detail["ml_prob"] = ml_probability

        # 가중합 (0~100)
        w = self.weights
        total = (
            w.get("factor", 0.3) * min(factor_avg, 100) / 100 * 100
            + w.get("timing", 0.3) * min(timing_avg, 100) / 100 * 100
            + w.get("ml", 0.4) * ml_probability * 100
        )
        total = round(float(np.clip(total, 0, 100)), 2)

        signal = self._classify_signal(total)

        return ScoreResult(
            stock_code=stock_code,
            total_score=total,
            signal=signal,
            score_detail=detail,
        )

    def _classify_signal(self, score: float) -> str:
        """점수 → 시그널 판정. 보고서 기준 임계값."""
        if score >= self.thresholds.get("strong_buy", 85):
            return "strong_buy"
        elif score >= self.thresholds.get("buy", 65):
            return "buy"
        elif score >= self.thresholds.get("hold", 45):
            return "hold"
        elif score >= self.thresholds.get("sell", 25):
            return "sell"
        else:
            return "strong_sell"

    def rank_results(self, results: list[ScoreResult]) -> list[ScoreResult]:
        """점수 기준 내림차순 정렬 + 순위 부여."""
        results.sort(key=lambda r: r.total_score, reverse=True)
        for i, r in enumerate(results, 1):
            r.rank = i
        return results

    # ── public.stock_scores 매핑 ──

    def to_public_scores(self, result: ScoreResult) -> dict:
        """ScoreResult를 public.stock_scores 컬럼에 매핑.

        public.stock_scores: fundamental(0~100), momentum(0~100),
                             disclosure(0~100), institutional(0~100), total(0~100)
        """
        d = result.score_detail
        return {
            "stock_id": result.stock_code,
            "fundamental": int(np.clip(
                (d.get("f_per", 0) + d.get("f_pbr", 0) + d.get("f_roe", 0)) / 3 * 100,
                0, 100)),
            "momentum": int(np.clip(d.get("timing_raw", 50), 0, 100)),
            "disclosure": int(np.clip(d.get("f_event", 50), 0, 100)),
            "institutional": 50,  # TODO: foreign_ratio 변화 스코어링 추가 시 활성화
            "total": int(np.clip(result.total_score, 0, 100)),
            "score_descriptions": [
                f"시그널: {result.signal}",
                f"팩터: {d.get('factor_raw', 0):.1f}",
                f"타이밍: {d.get('timing_raw', 0):.1f}",
                f"ML확률: {d.get('ml_prob', 0.5):.2f}",
            ],
        }
