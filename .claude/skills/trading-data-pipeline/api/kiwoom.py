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

    def get_volume_ranking(self, market: str = '001', top_n: int = 200) -> list[dict]:
        """
        ka10023 - 거래량급증요청 (페이지네이션 지원)
        코스피(001) 거래량 상위 종목 반환. top_n개까지 수집.
        """
        all_stocks: list[dict] = []
        next_key = ''
        page = 0

        while len(all_stocks) < top_n:
            body = {
                'mrkt_tp': market,
                'sort_tp': '1',
                'tm_tp': '2',
                'trde_qty_tp': '5',
                'tm': '',
                'stk_cnd': '0',
                'pric_tp': '0',
                'stex_tp': '1',
            }
            headers = self._headers('ka10023')
            if next_key:
                headers['cont-yn'] = 'Y'
                headers['next-key'] = next_key

            resp = httpx.post(
                f'{self.base_url}/api/dostk/rkinfo',
                headers=headers,
                json=body,
                timeout=30,
            )
            result = resp.json()
            if result.get('return_code') != 0:
                break

            batch = result.get('trde_qty_sdnin', [])
            if not batch:
                break
            all_stocks.extend(batch)
            page += 1

            # 연속 조회 확인
            cont = resp.headers.get('cont-yn', 'N')
            if cont != 'Y':
                break
            next_key = resp.headers.get('next-key', '')
            if not next_key:
                break

            time.sleep(self.delay)  # rate limit 대응

        return all_stocks[:top_n]

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

    def get_investor_trading(self, stk_cd: str, dt: str) -> list[dict]:
        """
        ka10059 - 종목별투자자기관별요청
        해당 일자의 투자자 유형별(기관/외국인/연기금 등) 순매수 금액 반환.
        전체 투자자 유형을 한번에 반환 → 종목당 1회 호출로 충분.

        Returns:
            [{dt, ind_invsr, frgnr_invsr, orgn, fnnc_invt, insrnc, invtrt,
              etc_fnnc, bank, penfnd_etc, samo_fund, natn, etc_corp, natfor}, ...]
        """
        result = self._post('/api/dostk/stkinfo', 'ka10059', {
            'dt': dt,
            'stk_cd': stk_cd,
            'amt_qty_tp': '1',   # 금액 기준
            'trde_tp': '0',      # 순매수
            'unit_tp': '1000',   # 천원 단위
        })
        return result.get('stk_invsr_orgn', [])

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
