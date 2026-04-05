"""
indicators.py — 기술적 지표 계산 모듈

OHLCV DataFrame을 입력받아 이동평균, RSI, MACD, 볼린저밴드 등
기술적 지표를 계산하여 컬럼으로 추가.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


class TechnicalIndicators:
    """OHLCV DataFrame에 기술적 지표를 추가하는 유틸리티."""

    @staticmethod
    def moving_averages(df: pd.DataFrame, periods: list[int] | None = None) -> pd.DataFrame:
        """단순 이동평균(SMA) 추가."""
        periods = periods or [5, 20, 60, 120]
        for p in periods:
            if len(df) >= p:
                df[f"ma{p}"] = df["close"].rolling(window=p).mean()
            else:
                df[f"ma{p}"] = np.nan
        return df

    @staticmethod
    def rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """RSI (Relative Strength Index) 계산."""
        delta = df["close"].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = (-delta).where(delta < 0, 0.0)

        avg_gain = gain.ewm(alpha=1 / period, min_periods=period).mean()
        avg_loss = loss.ewm(alpha=1 / period, min_periods=period).mean()

        rs = avg_gain / avg_loss.replace(0, np.nan)
        df["rsi14"] = 100 - (100 / (1 + rs))
        return df

    @staticmethod
    def macd(df: pd.DataFrame, fast: int = 12, slow: int = 26,
             signal: int = 9) -> pd.DataFrame:
        """MACD, Signal, Histogram 계산."""
        ema_fast = df["close"].ewm(span=fast, adjust=False).mean()
        ema_slow = df["close"].ewm(span=slow, adjust=False).mean()
        df["macd"] = ema_fast - ema_slow
        df["macd_signal"] = df["macd"].ewm(span=signal, adjust=False).mean()
        df["macd_hist"] = df["macd"] - df["macd_signal"]
        return df

    @staticmethod
    def bollinger_bands(df: pd.DataFrame, period: int = 20,
                        num_std: float = 2.0) -> pd.DataFrame:
        """볼린저밴드 (상한, 중심, 하한) 계산."""
        sma = df["close"].rolling(window=period).mean()
        std = df["close"].rolling(window=period).std()
        df["bb_upper"] = sma + num_std * std
        df["bb_middle"] = sma
        df["bb_lower"] = sma - num_std * std
        df["bb_width"] = (df["bb_upper"] - df["bb_lower"]) / df["bb_middle"]
        return df

    @staticmethod
    def disparity(df: pd.DataFrame, period: int = 20) -> pd.DataFrame:
        """이격도 (현재가 / MA 비율 %)."""
        ma_col = f"ma{period}"
        if ma_col not in df.columns:
            df[ma_col] = df["close"].rolling(window=period).mean()
        df[f"disparity{period}"] = (df["close"] / df[ma_col]) * 100
        return df

    @staticmethod
    def week52_position(df: pd.DataFrame, cur_price: float,
                        high_52w: float, low_52w: float) -> float:
        """52주 고저 대비 현재 위치 (0~100%)."""
        if high_52w == low_52w:
            return 50.0
        return ((cur_price - low_52w) / (high_52w - low_52w)) * 100

    @staticmethod
    def compute_all(df: pd.DataFrame) -> pd.DataFrame:
        """모든 기술적 지표를 일괄 계산."""
        df = TechnicalIndicators.moving_averages(df)
        df = TechnicalIndicators.rsi(df)
        df = TechnicalIndicators.macd(df)
        df = TechnicalIndicators.bollinger_bands(df)
        df = TechnicalIndicators.disparity(df)
        return df

    @staticmethod
    def snapshot(df: pd.DataFrame) -> dict:
        """최신 행의 지표값을 dict로 추출 (DB 저장용)."""
        if df.empty:
            return {}
        last = df.iloc[-1]
        indicator_cols = [
            "ma5", "ma20", "ma60", "ma120",
            "rsi14", "macd", "macd_signal", "macd_hist",
            "bb_upper", "bb_middle", "bb_lower", "bb_width",
            "disparity20",
        ]
        result = {}
        for col in indicator_cols:
            if col in last.index and pd.notna(last[col]):
                result[col] = round(float(last[col]), 4)
        result["close"] = int(last["close"]) if pd.notna(last["close"]) else None
        result["volume"] = int(last["volume"]) if pd.notna(last.get("volume")) else None
        return result
