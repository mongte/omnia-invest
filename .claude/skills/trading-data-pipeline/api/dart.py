"""
OpenDART (금융감독원 전자공시시스템) API 래퍼
Rate limit 대응 (1초 delay) 포함.

사용:
    client = DartClient(api_key='...')
    disclosures = client.get_disclosures('00126380', '20260401', '20260405')
    financials = client.get_financial_statements('00126380', '2025', '11014')
"""

import httpx
import time


BASE_URL = 'https://opendart.fss.or.kr/api'


class DartClient:
    def __init__(self, api_key: str, delay: float = 1.0):
        self.api_key = api_key
        self.delay = delay
        self._last_call: float = 0

    def _rate_limit(self) -> None:
        elapsed = time.time() - self._last_call
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_call = time.time()

    def _get(self, endpoint: str, params: dict) -> dict:
        self._rate_limit()
        params['crtfc_key'] = self.api_key
        resp = httpx.get(f'{BASE_URL}{endpoint}', params=params, timeout=30)
        result = resp.json()
        if result.get('status') not in ('000', '013'):
            raise Exception(f"OpenDART 오류: {result.get('message', result.get('status'))}")
        return result

    def get_disclosures(
        self,
        corp_code: str,
        bgn_de: str,
        end_de: str,
        page_count: int = 20,
    ) -> list[dict]:
        """
        공시 목록 조회 (/list.json)

        Args:
            corp_code: DART 고유번호 (8자리)
            bgn_de: 시작일 (YYYYMMDD)
            end_de: 종료일 (YYYYMMDD)

        Returns:
            [{rcept_no, corp_name, report_nm, flr_nm, rcept_dt, ...}, ...]
        """
        result = self._get('/list.json', {
            'corp_code': corp_code,
            'bgn_de': bgn_de,
            'end_de': end_de,
            'page_count': str(page_count),
        })
        return result.get('list', [])

    def get_financial_statements(
        self,
        corp_code: str,
        bsns_year: str,
        reprt_code: str,
        fs_div: str = 'CFS',
    ) -> list[dict]:
        """
        재무제표 조회 (/fnlttSinglAcntAll.json)

        Args:
            corp_code: DART 고유번호
            bsns_year: 사업연도 (YYYY)
            reprt_code: 11013=Q1, 11012=반기, 11014=Q3/연간
            fs_div: OFS=별도, CFS=연결

        Returns:
            [{account_id, account_nm, thstrm_amount, frmtrm_amount, ...}, ...]
        """
        result = self._get('/fnlttSinglAcntAll.json', {
            'corp_code': corp_code,
            'bsns_year': bsns_year,
            'reprt_code': reprt_code,
            'fs_div': fs_div,
        })
        return result.get('list', [])

    def get_multiple_disclosures(
        self,
        corps: list[dict],
        bgn_de: str,
        end_de: str,
    ) -> dict[str, list[dict]]:
        """여러 기업 공시 일괄 조회"""
        results: dict[str, list[dict]] = {}
        for corp in corps:
            code = corp.get('corp_code', '')
            if not code:
                continue
            try:
                results[code] = self.get_disclosures(code, bgn_de, end_de)
            except Exception as e:
                results[code] = [{'error': str(e)}]
        return results
