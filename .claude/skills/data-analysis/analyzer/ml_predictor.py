"""
ml_predictor.py — ML Layer 3: 주가 방향 예측 모듈

LightGBM으로 향후 N일 수익률 방향(상승/하락)을 예측.
Purged K-Fold 교차검증으로 시계열 누출 방지.

학습: 주간 1회 (주말 배치)
예측: 매일 장 마감 후 (runner.py에서 호출)
"""

from __future__ import annotations

import json
import os
import pickle
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .indicators import TechnicalIndicators

# 모델 저장 경로
MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_PATH = MODEL_DIR / "lgbm_direction.pkl"
META_PATH = MODEL_DIR / "lgbm_meta.json"


# ── 피처 엔지니어링 ──

TECHNICAL_COLS = [
    # 기술적 지표 (indicators.py 산출물)
    "ma5", "ma20", "ma60", "ma120",
    "rsi14", "macd", "macd_signal", "macd_hist",
    "bb_upper", "bb_middle", "bb_lower", "bb_width",
    "disparity20",
    # 파생 피처
    "return_1d", "return_5d", "return_20d",
    "volume_ratio",  # volume / MA20_volume
    "volatility_20d",  # 20일 롤링 표준편차
    "high_low_range",  # (high - low) / close
]

FUNDAMENTAL_COLS = [
    "per", "pbr", "roe", "foreign_ratio", "market_cap_log",
]

FEATURE_COLS = TECHNICAL_COLS + FUNDAMENTAL_COLS


def build_features(ohlcv: pd.DataFrame, fundamentals: dict | None = None) -> pd.DataFrame:
    """OHLCV + 펀더멘털 → 학습/예측용 피처 DataFrame 생성."""
    df = ohlcv.copy()

    # 기술적 지표
    df = TechnicalIndicators.compute_all(df)

    # 파생 피처
    df["return_1d"] = df["close"].pct_change(1)
    df["return_5d"] = df["close"].pct_change(5)
    df["return_20d"] = df["close"].pct_change(20)
    df["volume_ratio"] = df["volume"] / df["volume"].rolling(20).mean()
    df["volatility_20d"] = df["return_1d"].rolling(20).std()
    df["high_low_range"] = (df["high"] - df["low"]) / df["close"]

    # 펀더멘털 (시계열 전체에 동일 값 적용)
    if fundamentals:
        df["per"] = fundamentals.get("per", np.nan)
        df["pbr"] = fundamentals.get("pbr", np.nan)
        df["roe"] = fundamentals.get("roe", np.nan)
        df["foreign_ratio"] = fundamentals.get("foreign_ratio", np.nan)
        mc = fundamentals.get("market_cap", 0) or 0
        df["market_cap_log"] = np.log1p(mc) if mc > 0 else np.nan
    else:
        for col in ["per", "pbr", "roe", "foreign_ratio", "market_cap_log"]:
            df[col] = np.nan

    return df


def build_target(ohlcv: pd.DataFrame, lookforward: int = 5) -> pd.Series:
    """향후 N일 수익률 방향 (1=상승, 0=하락)."""
    future_return = ohlcv["close"].shift(-lookforward) / ohlcv["close"] - 1
    return (future_return > 0).astype(int)


# ── Purged K-Fold 교차검증 ──

def purged_kfold_split(
    n_samples: int, n_splits: int = 5, purge_gap: int = 10,
) -> list[tuple[np.ndarray, np.ndarray]]:
    """시계열 Purged K-Fold. 학습/검증 사이에 purge_gap만큼 간격.

    시간순 정렬된 데이터에서 미래 정보 누출 방지.
    """
    indices = np.arange(n_samples)
    fold_size = n_samples // n_splits
    splits = []

    for i in range(n_splits):
        val_start = i * fold_size
        val_end = min((i + 1) * fold_size, n_samples)

        # 검증 세트
        val_idx = indices[val_start:val_end]

        # 학습 세트: 검증 세트 앞뒤 purge_gap 제외
        train_mask = np.ones(n_samples, dtype=bool)
        train_mask[max(0, val_start - purge_gap):min(n_samples, val_end + purge_gap)] = False
        train_idx = indices[train_mask]

        if len(train_idx) > 0 and len(val_idx) > 0:
            splits.append((train_idx, val_idx))

    return splits


# ── MLPredictor 클래스 ──

class MLPredictor:
    """LightGBM 기반 주가 방향 예측기."""

    def __init__(self, lookforward: int = 5):
        self.lookforward = lookforward
        self.model = None
        self.feature_cols = FEATURE_COLS
        self.train_date: str | None = None

    def train(
        self,
        ohlcv_dict: dict[str, pd.DataFrame],
        fundamentals_df: pd.DataFrame,
        min_samples: int = 1000,
    ) -> dict[str, Any]:
        """전체 유니버스 데이터로 모델 학습.

        Args:
            ohlcv_dict: {stock_code: OHLCV DataFrame}
            fundamentals_df: 펀더멘털 DataFrame (stock_code 컬럼 포함)
            min_samples: 최소 학습 샘플 수
        Returns:
            학습 결과 메타데이터 (accuracy, n_samples 등)
        """
        import lightgbm as lgb

        # 전 종목 피처+타겟 합치기
        all_X = []
        all_y = []

        for code, ohlcv in ohlcv_dict.items():
            if len(ohlcv) < 60:  # 최소 60일 데이터 필요
                continue

            fund_row = fundamentals_df[fundamentals_df["stock_code"] == code]
            fund = fund_row.iloc[0].to_dict() if not fund_row.empty else None

            features = build_features(ohlcv, fund)
            target = build_target(ohlcv, self.lookforward)

            # 유효 행: 기술적 피처는 필수, 펀더멘털은 NaN 허용 (0으로 대체)
            valid_mask = features[TECHNICAL_COLS].notna().all(axis=1) & target.notna()
            if valid_mask.sum() < 30:
                continue

            valid_features = features.loc[valid_mask, self.feature_cols].copy()
            valid_features[FUNDAMENTAL_COLS] = valid_features[FUNDAMENTAL_COLS].fillna(0)
            all_X.append(valid_features)
            all_y.append(target[valid_mask])

        if not all_X:
            raise ValueError(f"학습 데이터 부족: 유효 종목 없음")

        X = pd.concat(all_X, ignore_index=True)
        y = pd.concat(all_y, ignore_index=True)

        if len(X) < min_samples:
            raise ValueError(f"학습 데이터 부족: {len(X)}건 < {min_samples}건")

        # Purged K-Fold 교차검증
        splits = purged_kfold_split(len(X), n_splits=5, purge_gap=self.lookforward * 2)
        cv_scores = []

        for train_idx, val_idx in splits:
            fold_model = lgb.LGBMClassifier(
                n_estimators=300,
                learning_rate=0.05,
                max_depth=6,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=1.0,
                reg_lambda=1.0,
                random_state=42,
                verbose=-1,
            )
            fold_model.fit(
                X.iloc[train_idx], y.iloc[train_idx],
                eval_set=[(X.iloc[val_idx], y.iloc[val_idx])],
                callbacks=[lgb.early_stopping(20, verbose=False)],
            )
            val_pred = fold_model.predict(X.iloc[val_idx])
            accuracy = (val_pred == y.iloc[val_idx]).mean()
            cv_scores.append(accuracy)

        # 전체 데이터로 최종 모델 학습
        self.model = lgb.LGBMClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=1.0,
            reg_lambda=1.0,
            random_state=42,
            verbose=-1,
        )
        self.model.fit(X, y)
        self.train_date = date.today().isoformat()

        meta = {
            "train_date": self.train_date,
            "n_samples": len(X),
            "n_features": len(self.feature_cols),
            "cv_accuracy_mean": round(float(np.mean(cv_scores)), 4),
            "cv_accuracy_std": round(float(np.std(cv_scores)), 4),
            "lookforward": self.lookforward,
            "feature_importance": dict(zip(
                self.feature_cols,
                [int(x) for x in self.model.feature_importances_],
            )),
        }

        # 모델 저장
        self.save_model(meta)
        return meta

    def predict(self, ohlcv: pd.DataFrame, fundamentals: dict | None = None) -> float | None:
        """종목 1개의 상승 확률 예측 (0.0~1.0).

        모델이 없으면 None 반환 → scoring.py에서 0.5 폴백.
        """
        if self.model is None:
            if not self.load_model():
                return None

        features = build_features(ohlcv, fundamentals)
        if features.empty:
            return None

        # 최신 행의 피처 (펀더멘털 NaN은 0으로 대체)
        last_row = features[self.feature_cols].iloc[-1:].copy()
        last_row[FUNDAMENTAL_COLS] = last_row[FUNDAMENTAL_COLS].fillna(0)
        if last_row[TECHNICAL_COLS].isna().any(axis=1).iloc[0]:
            return None

        proba = self.model.predict_proba(last_row)[0]
        # 상승(class=1) 확률 반환
        return float(proba[1]) if len(proba) > 1 else float(proba[0])

    def save_model(self, meta: dict | None = None) -> None:
        """모델과 메타데이터를 파일로 저장."""
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        if meta:
            with open(META_PATH, "w") as f:
                json.dump(meta, f, indent=2, ensure_ascii=False)

    def load_model(self) -> bool:
        """저장된 모델 로드. 성공 시 True."""
        if not MODEL_PATH.exists():
            return False
        with open(MODEL_PATH, "rb") as f:
            self.model = pickle.load(f)
        if META_PATH.exists():
            with open(META_PATH) as f:
                meta = json.load(f)
                self.train_date = meta.get("train_date")
        return True

    def needs_retrain(self, max_age_days: int = 7) -> bool:
        """재학습 필요 여부 (주간 기준)."""
        if self.train_date is None:
            return True
        trained = date.fromisoformat(self.train_date)
        return (date.today() - trained).days >= max_age_days
