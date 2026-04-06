"""
dynamic_weights.py — 동적 가중치 산출 모듈

보고서 2 섹션 1 기반. 3가지 방법론:
  1. IC 가중 (Information Coefficient Weighting)
  2. 시장 레짐 스위칭 (Market Regime Switching)
  3. ML 메타모델 (XGBoost Meta-Model)

최종 가중치는 EMA 스무딩으로 안정화.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


# ═══════════════════════════════════════════
# 1. IC 가중 (Information Coefficient)
# ═══════════════════════════════════════════
# w_i(t) = |IC_i(t)| / Σ|IC_j(t)|
# IC = Spearman rank correlation(팩터값, 미래수익률), 롤링 20일

def calculate_ic(factor_values: pd.Series, future_returns: pd.Series,
                 window: int = 20) -> pd.Series:
    """팩터 값과 미래 수익률 간의 롤링 IC(Spearman rank corr) 계산."""
    ic_series = factor_values.rolling(window=window).corr(
        future_returns.rolling(window=window).rank(pct=True)
    )
    return ic_series


def ic_weighting(ics: dict[str, pd.Series]) -> pd.DataFrame:
    """IC 절댓값 비례로 팩터 가중치 산출.

    Args:
        ics: {팩터명: IC 시계열} 딕셔너리
    Returns:
        pd.DataFrame: 시점별 팩터 가중치 (합계 = 1)
    """
    abs_ics = pd.DataFrame({name: ic.abs() for name, ic in ics.items()})
    sum_abs_ics = abs_ics.sum(axis=1)
    # 0으로 나누기 방지 → 균등 가중
    weights = abs_ics.divide(sum_abs_ics, axis=0).fillna(1.0 / len(ics))
    return weights


# ═══════════════════════════════════════════
# 2. 시장 레짐 스위칭 (Market Regime Switching)
# ═══════════════════════════════════════════
# regime_t = f(KOSPI_volatility_t, KOSPI_momentum_t)
# w_i(t) = WeightMap(regime_t)

# 기본 레짐별 가중치 (백테스트 통해 최적화 필요)
DEFAULT_REGIME_WEIGHTS: dict[int, dict[str, float]] = {
    # Regime 0: 강세장 (저변동 + 양수 모멘텀) → 모멘텀 가중
    0: {"factor": 0.2, "timing": 0.4, "ml": 0.4},
    # Regime 1: 횡보장 (중간 변동 + 약한 모멘텀) → 균등
    1: {"factor": 0.35, "timing": 0.35, "ml": 0.3},
    # Regime 2: 약세장 (고변동 + 음수 모멘텀) → 밸류/방어 가중
    2: {"factor": 0.5, "timing": 0.2, "ml": 0.3},
}


def identify_market_regime(
    kospi_volatility: pd.Series,
    kospi_momentum: pd.Series,
    n_regimes: int = 3,
) -> pd.Series:
    """KOSPI 변동성 + 모멘텀으로 시장 레짐 분류 (GMM).

    Args:
        kospi_volatility: KOSPI 20일 롤링 변동성
        kospi_momentum: KOSPI 60일 수익률
        n_regimes: 레짐 수 (기본 3: 강세/횡보/약세)
    Returns:
        pd.Series: 시점별 레짐 인덱스 (0, 1, 2)
    """
    from sklearn.mixture import GaussianMixture

    features = pd.DataFrame({
        "volatility": kospi_volatility,
        "momentum": kospi_momentum,
    }).dropna()

    gmm = GaussianMixture(n_components=n_regimes, random_state=42)
    gmm.fit(features)
    regimes = pd.Series(
        gmm.predict(features),
        index=features.index,
    )

    # 레짐 번호를 변동성 순으로 정렬 (0=저변동=강세, 2=고변동=약세)
    means = gmm.means_[:, 0]  # volatility 기준
    order = np.argsort(means)
    regime_map = {old: new for new, old in enumerate(order)}
    return regimes.map(regime_map)


def regime_weights(
    regime: int,
    weight_map: dict[int, dict[str, float]] | None = None,
) -> dict[str, float]:
    """레짐에 해당하는 팩터 가중치 반환."""
    wmap = weight_map or DEFAULT_REGIME_WEIGHTS
    return wmap.get(regime, DEFAULT_REGIME_WEIGHTS[1])  # 기본: 횡보장


# ═══════════════════════════════════════════
# 3. ML 메타모델 (XGBoost)
# ═══════════════════════════════════════════
# w_i(t) = XGBoost(IC_i(t-1), volatility(t-1), momentum(t-1), ...)

def train_ml_meta_model(
    features: pd.DataFrame,
    target_weights: pd.DataFrame,
) -> dict[str, Any]:
    """XGBoost 메타모델 훈련. 피처 → 최적 팩터 가중치 예측.

    Args:
        features: [IC_factor, IC_timing, volatility, momentum, ...] 시계열
        target_weights: 사후 최적 가중치 (백테스트 결과)
    Returns:
        {팩터명: xgb.Booster} 형태의 훈련된 모델 딕셔너리
    """
    import xgboost as xgb
    from sklearn.model_selection import train_test_split

    models = {}
    for factor_name in target_weights.columns:
        X_train, X_test, y_train, y_test = train_test_split(
            features, target_weights[factor_name],
            test_size=0.2, random_state=42,
        )
        model = xgb.XGBRegressor(
            objective="reg:squarederror",
            n_estimators=100, learning_rate=0.05, max_depth=5,
        )
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            early_stopping_rounds=10,
            verbose=False,
        )
        models[factor_name] = model
    return models


def predict_ml_weights(
    trained_models: dict[str, Any],
    current_features: pd.DataFrame,
) -> pd.Series:
    """훈련된 메타모델로 현재 시점의 팩터 가중치 예측."""
    predicted = {
        name: float(model.predict(current_features)[0])
        for name, model in trained_models.items()
    }
    # 음수 방지 + 합계 1로 정규화
    weights = np.maximum(0, list(predicted.values()))
    if weights.sum() > 0:
        weights = weights / weights.sum()
    else:
        weights = np.ones(len(predicted)) / len(predicted)
    return pd.Series(weights, index=predicted.keys())


# ═══════════════════════════════════════════
# 4. EMA 스무딩 (가중치 안정화)
# ═══════════════════════════════════════════
# w_i^{EMA}(t) = α × w_i^{new}(t) + (1 - α) × w_i^{EMA}(t-1)

def ema_smoothing(
    new_weights: pd.Series,
    previous_ema: pd.Series | None,
    alpha: float = 0.2,
) -> pd.Series:
    """EMA 스무딩으로 가중치 급변 방지.

    Args:
        new_weights: 현재 시점 산출된 가중치
        previous_ema: 전일 EMA 스무딩 가중치 (None이면 초기값)
        alpha: 스무딩 계수 (0 < α < 1). 클수록 최근 반영 ↑
    """
    if previous_ema is None:
        return new_weights
    return alpha * new_weights + (1 - alpha) * previous_ema


# ═══════════════════════════════════════════
# 5. 통합: 동적 가중치 산출기
# ═══════════════════════════════════════════

class DynamicWeightEngine:
    """동적 가중치 산출 엔진. IC가중 + 레짐스위칭 혼합 (기본).

    ML 메타모델은 충분한 학습 데이터 확보 후 활성화.
    """

    def __init__(
        self,
        method: str = "ic_regime_hybrid",
        ema_alpha: float = 0.2,
        ic_window: int = 20,
        regime_weight_map: dict[int, dict[str, float]] | None = None,
    ):
        self.method = method
        self.ema_alpha = ema_alpha
        self.ic_window = ic_window
        self.regime_weight_map = regime_weight_map
        self._prev_ema: pd.Series | None = None

    def compute(
        self,
        factor_scores: dict[str, pd.Series],
        future_returns: pd.Series,
        kospi_vol: pd.Series | None = None,
        kospi_mom: pd.Series | None = None,
    ) -> pd.Series:
        """현재 시점의 동적 가중치를 산출.

        Returns:
            pd.Series: {factor_name: weight} (합계 = 1)
        """
        if self.method == "ic_only":
            weights = self._ic_weights(factor_scores, future_returns)
        elif self.method == "regime_only":
            weights = self._regime_weights(kospi_vol, kospi_mom)
        elif self.method == "ic_regime_hybrid":
            # IC 가중 70% + 레짐 보정 30%
            ic_w = self._ic_weights(factor_scores, future_returns)
            reg_w = self._regime_weights(kospi_vol, kospi_mom)
            weights = 0.7 * ic_w + 0.3 * reg_w
            weights = weights / weights.sum()  # 재정규화
        else:
            # 균등 가중 폴백
            n = len(factor_scores)
            weights = pd.Series(1.0 / n, index=factor_scores.keys())

        # EMA 스무딩 적용
        smoothed = ema_smoothing(weights, self._prev_ema, self.ema_alpha)
        self._prev_ema = smoothed
        return smoothed

    def _ic_weights(
        self, factor_scores: dict[str, pd.Series], future_returns: pd.Series,
    ) -> pd.Series:
        ics = {
            name: calculate_ic(scores, future_returns, self.ic_window)
            for name, scores in factor_scores.items()
        }
        # 최신 시점의 IC 가중치
        ic_df = ic_weighting(ics)
        if ic_df.empty:
            return pd.Series(1.0 / len(factor_scores), index=factor_scores.keys())
        return ic_df.iloc[-1]

    def _regime_weights(
        self, kospi_vol: pd.Series | None, kospi_mom: pd.Series | None,
    ) -> pd.Series:
        if kospi_vol is None or kospi_mom is None:
            return pd.Series({"factor": 0.35, "timing": 0.35, "ml": 0.3})
        regimes = identify_market_regime(kospi_vol, kospi_mom)
        current_regime = int(regimes.iloc[-1])
        w = regime_weights(current_regime, self.regime_weight_map)
        return pd.Series(w)
