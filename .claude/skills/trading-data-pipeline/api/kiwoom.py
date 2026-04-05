"""
키움증권 REST API 래퍼
OAuth 토큰 캐싱, rate limit 대응 포함.

사용:
    client = KiwoomClient(api_key='...', api_secret='...')
    info = client.get_stock_info('005930')
    ranking = client.get_volume_ranking()
    ohlcv = client.get_daily_chart('005930', '20260405')
"""

import httpx
import time
from typing import Optional


class KiwoomClient:
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        base_url: str = 'https://api.kiwoom.com',
        delay: float = 0.5,
    ):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url
        self.delay = delay
        self._token: Optional[str] = None
        self._token_expires: float = 0

    def get_token(self) -> str:
        """OAuth 토큰 발급 (1시간 캐싱)"""
        if self._token and time.time() < self._token_expires:
            return self._token

        resp = httpx.post(
            f'{self.base_url}/oauth2/token',
            json={
                'grant_type': 'client_credentials',
                'appkey': self.api_key,
                'secretkey': self.api_secret,
            },
            timeout=30,
        )
        result = resp.json()
        if result.get('return_code') != 0:
            raise Exception(f"토큰 발급 실패: {result.get('return_msg')}")

        self._token = result['token']
        self._token_expires = time.time() + 3500  # 약 58분
        return self._token

    def _headers(self, api_id: str) -> dict[str, str]:
        return {
            'Content-Type': 'application/json;charset=UTF-8',
            'api-id': api_id,
            'authorization': f'Bearer {self.get_token()}',
        }

    def _post(self, url: str, api_id: str, body: dict) -> dict:
        resp = httpx.post(
            f'{self.base_url}{url}',
            headers=self._headers(api_id),
            json=body,
            timeout=30,
        )
        result = resp.json()
        if result.get('return_code') != 0:
            raise Exception(f"[{api_id}] {result.get('return_msg')}")
        return result

    def get_stock_info(self, stock_code: str) -> dict:
        """
        ka10001 - 주식기본정보요청
        PER, PBR, EPS, BPS, ROE, 시가총액 등
        """
        return self._post('/api/dostk/stkinfo', 'ka10001', {'stk_cd': stock_code})

    def get_volume_ranking(self, market: str = '001') -> list[dict]:
        """
        ka10023 - 거래량급증요청
        코스피(001) 거래량 상위 종목 반환.
        """
        result = self._post('/api/dostk/rkinfo', 'ka10023', {
            'mrkt_tp': market,
            'sort_tp': '1',
            'tm_tp': '2',
            'trde_qty_tp': '5',
            'tm': '',
            'stk_cnd': '0',
            'pric_tp': '0',
            'stex_tp': '1',
        })
        return result.get('trde_qty_sdnin', [])

    def get_daily_chart(self, stock_code: str, base_dt: str) -> list[dict]:
        """
        ka10081 - 주식일봉차트조회요청
        600건/회, 연속조회 지원. base_dt 기준 과거 방향 조회.

        Returns:
            [{dt, cur_prc, open_pric, high_pric, low_pric, trde_qty, trde_prica, pred_pre, trde_tern_rt}, ...]
        """
        result = self._post('/api/dostk/chart', 'ka10081', {
            'stk_cd': stock_code,
            'base_dt': base_dt,
            'upd_stkpc_tp': '1',
        })
        return result.get('stk_dt_pole_chart_qry', [])

    def get_multiple_stocks(self, stock_codes: list[str]) -> dict[str, dict]:
        """여러 종목 기본정보 조회 (rate limit 대응)"""
        results: dict[str, dict] = {}
        for i, code in enumerate(stock_codes):
            if i > 0:
                time.sleep(self.delay)
            try:
                results[code] = self.get_stock_info(code)
            except Exception as e:
                results[code] = {'error': str(e)}
        return results
