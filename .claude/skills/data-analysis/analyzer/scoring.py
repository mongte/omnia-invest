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
        """Layer 1 서브팩터별 정규화된 점수 산출.

        stock_fundamentals가 NULL이면 financial_statements에서 직접 계산(fallback).
        - ROE = 당기순이익 / 자본총계 * 100
        - PBR = 시가총액 / 자본총계 (market_cap 필요)
        - PER = 시가총액 / 당기순이익 (market_cap 필요)
        """
        scores: dict[str, float] = {}

        # fundamentals가 비어있으면 재무제표에서 fallback 값 계산
        per = fundamentals.get("per")
        pbr = fundamentals.get("pbr")
        roe = fundamentals.get("roe")

        # 문자열→float 변환 (키움 API가 문자열로 반환하는 경우 대비)
        per = self._to_float(per)
        pbr = self._to_float(pbr)
        roe = self._to_float(roe)

        # fallback: financial_statements에서 계산
        if (per is None or pbr is None or roe is None) and not financials.empty:
            fb = self._calc_fundamentals_from_financials(
                financials, stock_code, fundamentals.get("market_cap")
            )
            if per is None:
                per = fb.get("per")
            if pbr is None:
                pbr = fb.get("pbr")
            if roe is None:
                roe = fb.get("roe")

        # 밸류: PER (역수 정규화 — 낮을수록 고점)
        if per is not None and per > 0:
            scores["per"] = float(1.0 / per)
        else:
            scores["per"] = 0.0

        # 밸류: PBR (역수 정규화)
        if pbr is not None and pbr > 0:
            scores["pbr"] = float(1.0 / pbr)
        else:
            scores["pbr"] = 0.0

        # 퀄리티: ROE (높을수록 고점)
        scores["roe"] = float(roe) if roe is not None else 0.0

        # 퀄리티: 매출성장률 YoY
        scores["revenue_growth"] = self._revenue_growth(financials, stock_code)

        # 이벤트: 공시유형별 점수
        scores["event"] = self._event_score(disclosures, stock_code)

        return scores

    @staticmethod
    def _to_float(val: object) -> float | None:
        """문자열/숫자를 float로 변환. 0이나 변환 불가는 None."""
        if val is None:
            return None
        try:
            f = float(val)
            return f if f != 0 else None
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _calc_fundamentals_from_financials(
        financials: pd.DataFrame, stock_code: str, market_cap: object
    ) -> dict[str, float | None]:
        """financial_statements에서 ROE/PER/PBR 직접 계산.

        계정과목:
        - 자본총계: sj_div='BS', account_id='ifrs-full_Equity'
        - 당기순이익: sj_div='IS', account_id='ifrs-full_ProfitLoss'
        """
        result: dict[str, float | None] = {"per": None, "pbr": None, "roe": None}

        stock_fs = financials[financials["stock_code"] == stock_code]
        if stock_fs.empty:
            return result

        # 최신 사업연도 기준
        latest_year = stock_fs["bsns_year"].max()
        year_fs = stock_fs[stock_fs["bsns_year"] == latest_year]

        # 자본총계 (BS, ifrs-full_Equity)
        equity_rows = year_fs[
            (year_fs["sj_div"] == "BS") &
            (year_fs["account_id"] == "ifrs-full_Equity")
        ]
        equity = equity_rows.iloc[0]["current_amount"] if not equity_rows.empty else None

        # 당기순이익 (IS 또는 CIS, ifrs-full_ProfitLoss)
        income_rows = year_fs[
            (year_fs["sj_div"].isin(["IS", "CIS"])) &
            (year_fs["account_id"] == "ifrs-full_ProfitLoss")
        ]
        net_income = income_rows.iloc[0]["current_amount"] if not income_rows.empty else None

        # ROE 계산
        if equity and net_income and equity != 0:
            result["roe"] = round(float(net_income) / float(equity) * 100, 2)

        # PER/PBR: market_cap이 있어야 계산 가능
        mc = None
        if market_cap is not None:
            try:
                mc = float(market_cap)
                if mc <= 0:
                    mc = None
            except (ValueError, TypeError):
                mc = None

        if mc and equity and equity > 0:
            # market_cap 단위가 억원이면 × 1억으로 변환하여 원 단위 맞춤
            # stock_fundamentals.market_cap은 억원 단위 (키움 API 기준)
            mc_won = mc * 100_000_000
            result["pbr"] = round(mc_won / float(equity), 2)

        if mc and net_income and net_income > 0:
            mc_won = mc * 100_000_000
            result["per"] = round(mc_won / float(net_income), 2)

        return result

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

    @staticmethod
    def _safe_int(val: float, default: int = 50) -> int:
        """NaN/Inf 안전한 int 변환."""
        if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
            return default
        return int(np.clip(val, 0, 100))

    def to_public_scores(self, result: ScoreResult, *,
                         normalized_momentum: float | None = None) -> dict:
        """ScoreResult를 public.stock_scores 컬럼에 매핑.

        public.stock_scores: fundamental(0~100), momentum(0~100),
                             disclosure(0~100), institutional(0~100), total(0~100)

        Args:
            normalized_momentum: 전체 유니버스 대비 min-max 정규화된 모멘텀 점수(0~100).
                runner에서 timing_raw를 정규화하여 전달.
        """
        d = result.score_detail
        f_per = d.get("f_per", 0) or 0
        f_pbr = d.get("f_pbr", 0) or 0
        f_roe = d.get("f_roe", 0) or 0
        fund_avg = (f_per + f_pbr + f_roe) / 3 * 100

        # momentum: 정규화된 값 우선, 없으면 기존 timing_raw 사용
        momentum_score = normalized_momentum if normalized_momentum is not None else d.get("timing_raw", 50)

        return {
            "stock_id": result.stock_code,
            "fundamental": self._safe_int(fund_avg),
            "momentum": self._safe_int(momentum_score),
            "disclosure": self._safe_int(d.get("f_event", 50)),
            "institutional": 50,
            "total": self._safe_int(result.total_score),
            "score_descriptions": [
                f"시그널: {result.signal}",
                f"팩터: {d.get('factor_raw', 0) or 0:.1f}",
                f"타이밍: {d.get('timing_raw', 0) or 0:.1f}",
                f"ML확률: {d.get('ml_prob', 0.5) or 0.5:.2f}",
            ],
        }
