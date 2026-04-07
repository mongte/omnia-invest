"""
base.py — Supabase 연결 & 데이터 로드 컨텍스트

trading 스키마에서 OHLCV, 펀더멘털, 재무제표, 공시 데이터를 로드하고
활성 전략 파라미터를 파싱하는 기반 모듈.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

import pandas as pd
from supabase import create_client, Client


def _get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


@dataclass
class AnalysisContext:
    """분석 실행에 필요한 모든 데이터와 전략 파라미터를 보유."""

    client: Client = field(default_factory=_get_client)
    strategy: dict[str, Any] = field(default_factory=dict)
    universe: pd.DataFrame = field(default_factory=pd.DataFrame)
    ohlcv: dict[str, pd.DataFrame] = field(default_factory=dict)
    fundamentals: pd.DataFrame = field(default_factory=pd.DataFrame)
    financials: pd.DataFrame = field(default_factory=pd.DataFrame)
    disclosures: pd.DataFrame = field(default_factory=pd.DataFrame)
    investor_trading: pd.DataFrame = field(default_factory=pd.DataFrame)

    def load_active_strategy(self) -> dict[str, Any]:
        """활성 전략을 로드하여 self.strategy에 저장."""
        resp = (
            self.client.schema("trading")
            .table("strategies")
            .select("*")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        self.strategy = resp.data[0] if resp.data else {}
        if not self.strategy:
            raise ValueError("활성화된 전략이 없습니다. 먼저 전략을 등록/활성화하세요.")
        # params가 문자열이면 JSON 파싱
        if isinstance(self.strategy.get("params"), str):
            import json
            self.strategy["params"] = json.loads(self.strategy["params"])
        return self.strategy

    # ETF/ETN 이름 접두사 패턴 (키움 API 거래량급증에 포함되는 비주식 종목)
    _ETF_ETN_PREFIXES = (
        "KODEX", "TIGER", "SOL", "ACE", "RISE", "PLUS", "HANARO",
        "KIWOOM", "BNK", "WON", "TIME", "KoAct", "UNICORN", "1Q", "N2",
    )
    _ETN_KEYWORDS = ("ETN", "선물 ETN")

    @staticmethod
    def _is_etf_etn_or_preferred(row: dict) -> bool:
        """ETF/ETN/우선주 여부 판별.

        필터링 기준:
        - 종목코드가 6자리 숫자가 아닌 경우 (알파벳 포함 ETF: 0177N0 등)
        - 이름이 ETF 운용사 접두사로 시작하는 경우
        - 이름에 'ETN' 키워드가 포함된 경우
        - 우선주: 이름이 '우'로 끝나는 경우
        """
        import re

        code = row.get("stock_code", "")
        name = row.get("corp_name", "")

        # 비정규 종목코드 (알파벳 포함)
        if not re.match(r"^\d{6}$", code):
            return True

        # ETF: 운용사 이름 접두사
        for prefix in AnalysisContext._ETF_ETN_PREFIXES:
            if name.startswith(prefix):
                return True

        # ETN: 증권사 이름 + 키워드
        if "ETN" in name:
            return True

        # 우선주: 이름이 '우'로 끝남
        if name.endswith("우"):
            return True

        return False

    def load_universe(self) -> pd.DataFrame:
        """활성 유니버스 종목 목록 로드 (stock_code 중복 제거, ETF/ETN/우선주 필터링)."""
        resp = (
            self.client.schema("trading")
            .table("watch_universe")
            .select("stock_code,corp_code,corp_name,rank")
            .eq("is_active", True)
            .order("rank")
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            df = df.drop_duplicates(subset=["stock_code"], keep="first")
            # ETF/ETN/우선주 제외
            mask = df.apply(
                lambda row: not self._is_etf_etn_or_preferred(row.to_dict()),
                axis=1,
            )
            self.universe = df[mask].reset_index(drop=True)
        else:
            self.universe = pd.DataFrame()
        return self.universe

    def load_ohlcv(self, stock_codes: list[str] | None = None,
                   days: int = 365) -> dict[str, pd.DataFrame]:
        """종목별 OHLCV 데이터를 DataFrame dict로 로드."""
        codes = stock_codes or self.universe["stock_code"].tolist()
        cutoff = date.today().isoformat()

        for code in codes:
            resp = (
                self.client.schema("trading")
                .table("ohlcv_daily")
                .select("trade_date,open_price,high_price,low_price,close_price,volume,change_rate")
                .eq("stock_code", code)
                .order("trade_date", desc=True)
                .limit(days)
                .execute()
            )
            if resp.data:
                df = pd.DataFrame(resp.data)
                df["trade_date"] = pd.to_datetime(df["trade_date"])
                df = df.sort_values("trade_date").reset_index(drop=True)
                # 컬럼 축약
                df = df.rename(columns={
                    "open_price": "open", "high_price": "high",
                    "low_price": "low", "close_price": "close",
                })
                self.ohlcv[code] = df

        return self.ohlcv

    def load_fundamentals(self) -> pd.DataFrame:
        """최신 펀더멘털 데이터 로드."""
        resp = (
            self.client.schema("trading")
            .table("stock_fundamentals")
            .select("stock_code,per,pbr,eps,bps,roe,market_cap,foreign_ratio,week52_high,week52_low,cur_price")
            .order("fetch_date", desc=True)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            # 종목별 최신 1건만
            self.fundamentals = df.drop_duplicates(subset=["stock_code"], keep="first")
        return self.fundamentals

    def load_financials(self, stock_codes: list[str] | None = None) -> pd.DataFrame:
        """재무제표 데이터 로드 (연결 기준)."""
        query = (
            self.client.schema("trading")
            .table("financial_statements")
            .select("stock_code,bsns_year,reprt_code,fs_div,sj_div,account_id,account_name,current_amount,prev_amount")
            .eq("fs_div", "CFS")  # 연결재무제표
        )
        if stock_codes:
            query = query.in_("stock_code", stock_codes)
        resp = query.order("bsns_year", desc=True).execute()
        self.financials = pd.DataFrame(resp.data) if resp.data else pd.DataFrame()
        return self.financials

    def load_disclosures(self, days: int = 90) -> pd.DataFrame:
        """최근 공시 데이터 로드."""
        cutoff = date.today().isoformat()
        resp = (
            self.client.schema("trading")
            .table("disclosures")
            .select("stock_code,rcept_date,report_name,disclosure_type")
            .order("rcept_date", desc=True)
            .limit(2000)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            df["rcept_date"] = pd.to_datetime(df["rcept_date"])
            cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=days)
            self.disclosures = df[df["rcept_date"] >= cutoff_date]
        return self.disclosures

    def load_investor_trading(self, days: int = 20) -> pd.DataFrame:
        """최근 N거래일 투자자 매매동향 로드 (trading.investor_trading)."""
        codes = self.universe["stock_code"].tolist()
        cutoff = (date.today() - __import__('datetime').timedelta(days=days * 2)).isoformat()
        resp = (
            self.client.schema("trading")
            .table("investor_trading")
            .select(
                "stock_code,trade_date,ind_invsr,frgnr_invsr,orgn,"
                "fnnc_invt,insrnc,invtrt,etc_fnnc,bank,penfnd_etc,"
                "samo_fund,natn,etc_corp,natfor"
            )
            .in_("stock_code", codes)
            .gte("trade_date", cutoff)
            .order("trade_date", desc=True)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            df["trade_date"] = pd.to_datetime(df["trade_date"])
            self.investor_trading = df
        return self.investor_trading

    def load_all(self) -> "AnalysisContext":
        """전체 데이터 일괄 로드."""
        self.load_active_strategy()
        self.load_universe()
        codes = self.universe["stock_code"].tolist()
        self.load_ohlcv(codes)
        self.load_fundamentals()
        self.load_financials(codes)
        self.load_disclosures()
        self.load_investor_trading()
        return self
