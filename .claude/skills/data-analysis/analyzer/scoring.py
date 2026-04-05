"""
scoring.py — 전략 파라미터 기반 팩터 스코어링

전략 params에 정의된 팩터 가중치와 기준값에 따라
종목별 점수를 산출하고 시그널을 판정.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class ScoreResult:
    """종목 1개의 스코어링 결과."""
    stock_code: str
    total_score: float
    signal: str
    score_detail: dict[str, float]
    rank: int = 0


class StrategyScorer:
    """전략 params 기반 팩터 스코어러."""

    DEFAULT_THRESHOLDS = {
        "strong_buy": 80, "buy": 65, "hold": 40, "sell": 25,
    }

    def __init__(self, params: dict[str, Any]):
        self.factors = params.get("factors", {})
        self.thresholds = params.get("signal_thresholds", self.DEFAULT_THRESHOLDS)

    # ── 팩터별 스코어 계산 ──

    def momentum_score(self, indicators: dict) -> float:
        """모멘텀 스코어 (RSI, MACD, MA 크로스 기반). 0~100."""
        scores = []

        # RSI 스코어: 30~70 정상, 극단값 감점
        rsi = indicators.get("rsi14")
        if rsi is not None:
            if 40 <= rsi <= 60:
                scores.append(60)  # 중립
            elif 30 <= rsi < 40:
                scores.append(70)  # 과매도 근접 = 매수 기회
            elif rsi < 30:
                scores.append(80)  # 과매도 = 강한 매수 신호
            elif 60 < rsi <= 70:
                scores.append(50)  # 과매수 근접
            else:
                scores.append(30)  # 과매수 = 매도 신호

        # MACD 히스토그램: 양수 → 상승 모멘텀
        macd_hist = indicators.get("macd_hist")
        if macd_hist is not None:
            if macd_hist > 0:
                scores.append(min(80, 50 + macd_hist * 10))
            else:
                scores.append(max(20, 50 + macd_hist * 10))

        # MA 크로스: 종가 > MA20 → 상승 추세
        close = indicators.get("close")
        ma20 = indicators.get("ma20")
        ma60 = indicators.get("ma60")
        if close and ma20:
            if close > ma20:
                scores.append(70)
            else:
                scores.append(30)
        if ma20 and ma60:
            if ma20 > ma60:
                scores.append(70)  # 골든크로스 상태
            else:
                scores.append(30)  # 데드크로스 상태

        return float(np.mean(scores)) if scores else 50.0

    def value_score(self, fundamentals: dict) -> float:
        """밸류 스코어 (PER, PBR, ROE 기반). 0~100."""
        scores = []

        per = fundamentals.get("per")
        if per is not None and per > 0:
            # PER 낮을수록 저평가 (0~15 고점, 15~30 중립, 30+ 저점)
            if per < 10:
                scores.append(85)
            elif per < 15:
                scores.append(70)
            elif per < 25:
                scores.append(50)
            else:
                scores.append(30)

        pbr = fundamentals.get("pbr")
        if pbr is not None and pbr > 0:
            if pbr < 0.8:
                scores.append(85)
            elif pbr < 1.2:
                scores.append(70)
            elif pbr < 2.0:
                scores.append(50)
            else:
                scores.append(30)

        roe = fundamentals.get("roe")
        if roe is not None:
            if roe > 15:
                scores.append(85)
            elif roe > 10:
                scores.append(70)
            elif roe > 5:
                scores.append(50)
            else:
                scores.append(30)

        return float(np.mean(scores)) if scores else 50.0

    def quality_score(self, fundamentals: dict, financials: pd.DataFrame,
                      stock_code: str) -> float:
        """퀄리티 스코어 (ROE + 재무 안정성). 0~100."""
        scores = []

        # ROE (value_score와 중복이지만 가중치가 다를 수 있음)
        roe = fundamentals.get("roe")
        if roe is not None:
            scores.append(min(100, max(0, roe * 5)))  # ROE 20% → 100점

        # 매출액 성장률 (YoY)
        if not financials.empty:
            revenue = financials[
                (financials["stock_code"] == stock_code) &
                (financials["account_id"].str.contains("revenue|ifrs-full_Revenue", case=False, na=False))
            ].sort_values("bsns_year", ascending=False)

            if len(revenue) >= 2:
                cur = revenue.iloc[0].get("current_amount", 0) or 0
                prev = revenue.iloc[1].get("current_amount", 0) or 0
                if prev > 0:
                    growth = ((cur - prev) / abs(prev)) * 100
                    scores.append(min(100, max(0, 50 + growth)))

        return float(np.mean(scores)) if scores else 50.0

    def event_score(self, disclosures: pd.DataFrame, stock_code: str) -> float:
        """이벤트 스코어 (최근 공시 유형별 가중치). 0~100."""
        if disclosures.empty:
            return 50.0

        stock_disc = disclosures[disclosures["stock_code"] == stock_code]
        if stock_disc.empty:
            return 50.0

        # 공시 유형별 점수 가중치
        type_scores = {
            "earnings": 15,   # 실적 공시 → 긍정
            "buyback": 20,    # 자사주 매입 → 강한 긍정
            "dividend": 15,   # 배당 → 긍정
            "ownership": -5,  # 지분 변동 → 중립~부정
            "capital": -10,   # 유상증자 → 부정
            "etc": 0,
        }

        bonus = sum(
            type_scores.get(row["disclosure_type"], 0)
            for _, row in stock_disc.iterrows()
        )
        return float(np.clip(50 + bonus, 0, 100))

    # ── 종합 스코어링 ──

    def score_stock(
        self,
        stock_code: str,
        indicators: dict,
        fundamentals: dict,
        financials: pd.DataFrame,
        disclosures: pd.DataFrame,
    ) -> ScoreResult:
        """종목 1개의 종합 스코어 계산."""
        detail: dict[str, float] = {}

        # 팩터별 점수 계산
        factor_scores = {
            "momentum": self.momentum_score(indicators),
            "value": self.value_score(fundamentals),
            "quality": self.quality_score(fundamentals, financials, stock_code),
            "event": self.event_score(disclosures, stock_code),
        }

        # 전략 params에 정의된 팩터만 사용, 가중합 계산
        total_weight = 0.0
        weighted_sum = 0.0
        for factor_name, score in factor_scores.items():
            factor_cfg = self.factors.get(factor_name, {})
            weight = factor_cfg.get("weight", 0.25)  # 기본 균등 가중
            detail[factor_name] = round(score, 2)
            weighted_sum += score * weight
            total_weight += weight

        total = weighted_sum / total_weight if total_weight > 0 else 50.0
        total = round(float(np.clip(total, 0, 100)), 2)

        # 시그널 판정
        signal = self._classify_signal(total)

        return ScoreResult(
            stock_code=stock_code,
            total_score=total,
            signal=signal,
            score_detail=detail,
        )

    def _classify_signal(self, score: float) -> str:
        """점수 → 시그널 문자열 변환."""
        if score >= self.thresholds.get("strong_buy", 80):
            return "strong_buy"
        elif score >= self.thresholds.get("buy", 65):
            return "buy"
        elif score >= self.thresholds.get("hold", 40):
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
