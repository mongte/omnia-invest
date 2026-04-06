"""
normalizers.py — 지표별 정규화 모듈

보고서 2 섹션 2 기반. 각 지표의 특성에 맞는 정규화 방법 적용.
모든 출력은 0~1 범위.

매핑 테이블:
  PER, PBR, ROE, 매출성장률 → Min-Max Scaling
  이벤트(공시 CAR)           → Percentile Rank
  RSI, MACD, MA크로스        → Sigmoid 정규화
  볼린저밴드, 이격도          → Z-Score 롤링
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def min_max(series: pd.Series) -> pd.Series:
    """Min-Max Scaling. 안정적 분포의 펀더멘털 지표에 적합.
    X_norm = (X - X_min) / (X_max - X_min)
    """
    min_val = series.min()
    max_val = series.max()
    if max_val == min_val:
        return pd.Series(0.5, index=series.index)
    return (series - min_val) / (max_val - min_val)


def sigmoid(series: pd.Series, center: float = 0, scale: float = 1) -> pd.Series:
    """Sigmoid 정규화. 극단값 완화, RSI/MACD 등에 적합.
    σ(z) = 1 / (1 + e^{-z}),  z = (X - center) / scale
    """
    z = (series - center) / scale
    return 1 / (1 + np.exp(-z))


def percentile_rank(series: pd.Series) -> pd.Series:
    """Percentile Rank. 유니버스 내 상대 순위, 분포 가정 불필요.
    PercentileRank(X_i) = (X_i 이하 관측 수) / (전체 관측 수)
    """
    return series.rank(pct=True)


def z_score_rolling(series: pd.Series, window: int = 20) -> pd.Series:
    """Z-Score 롤링. 시계열 정규화, 모멘텀/변동성 지표에 적합.
    Z_t = (X_t - μ_rolling) / σ_rolling
    → Sigmoid으로 0~1 변환
    """
    rolling_mean = series.rolling(window=window).mean()
    rolling_std = series.rolling(window=window).std()
    # 표준편차 0 방지
    rolling_std = rolling_std.replace(0, np.nan)
    z = (series - rolling_mean) / rolling_std
    # Z-Score를 0~1로 변환 (sigmoid 적용)
    return 1 / (1 + np.exp(-z))


# ── 지표별 정규화 매핑 ──

NORM_MAP: dict[str, dict] = {
    # Layer 1: 팩터 (펀더멘털)
    "per":            {"fn": "min_max_inverse", "reason": "낮을수록 저평가 → 역수 후 Min-Max"},
    "pbr":            {"fn": "min_max_inverse", "reason": "낮을수록 저평가 → 역수 후 Min-Max"},
    "roe":            {"fn": "min_max",         "reason": "높을수록 우량 → 그대로 Min-Max"},
    "revenue_growth": {"fn": "min_max",         "reason": "높을수록 성장 → 그대로 Min-Max"},
    "event_car":      {"fn": "percentile_rank", "reason": "종목 간 상대 비교, 분포 가정 불필요"},

    # Layer 2: 타이밍 (기술적)
    "rsi14":          {"fn": "sigmoid", "center": 50, "scale": 10, "reason": "과매수/과매도 구간 부드럽게 변환"},
    "macd_hist":      {"fn": "sigmoid", "center": 0,  "scale": 1,  "reason": "양/음 전환 시그널, 극단값 완화"},
    "ma_cross":       {"fn": "sigmoid", "center": 0,  "scale": 1,  "reason": "추세 전환 강도 부드럽게 표현"},
    "bb_position":    {"fn": "z_score_rolling", "window": 20, "reason": "밴드 내 상대 위치, 시계열 특성 보존"},
    "disparity":      {"fn": "z_score_rolling", "window": 20, "reason": "이격도 시계열 내 상대 과열/과냉 측정"},
}


def normalize_indicator(series: pd.Series, indicator_name: str) -> pd.Series:
    """지표명에 따라 적절한 정규화 자동 적용."""
    cfg = NORM_MAP.get(indicator_name)
    if cfg is None:
        return min_max(series)  # 기본값

    fn_name = cfg["fn"]
    if fn_name == "min_max":
        return min_max(series)
    elif fn_name == "min_max_inverse":
        # PER/PBR: 낮을수록 좋으므로 역수 후 정규화
        inverted = 1 / series.replace(0, np.nan)
        return min_max(inverted.fillna(0))
    elif fn_name == "sigmoid":
        return sigmoid(series, center=cfg.get("center", 0), scale=cfg.get("scale", 1))
    elif fn_name == "percentile_rank":
        return percentile_rank(series)
    elif fn_name == "z_score_rolling":
        return z_score_rolling(series, window=cfg.get("window", 20))
    else:
        return min_max(series)
