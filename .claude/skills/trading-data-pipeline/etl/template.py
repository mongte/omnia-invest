"""
ETL 작업 베이스 클래스
extract → transform → load 패턴 + sync_log 자동 기록.

사용:
    class OhlcvETL(ETLJob):
        def extract(self) -> list[dict]:
            return kiwoom.get_daily_chart('005930', '20260405')

        def transform(self, raw: list[dict]) -> list[dict]:
            return [{'stock_code': '005930', 'trade_date': r['dt'], ...} for r in raw]

    job = OhlcvETL('ohlcv-backfill', supabase_url, supabase_key)
    job.run(table='ohlcv_daily', schema='trading')
"""

import httpx
import time
from datetime import datetime
from typing import Optional


class ETLJob:
    def __init__(self, name: str, supabase_url: str, supabase_key: str):
        self.name = name
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self._start_time: Optional[float] = None

    def _headers(self, schema: str = 'trading') -> dict[str, str]:
        return {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates,return=minimal',
            'Accept-Profile': schema,
            'Content-Profile': schema,
        }

    def extract(self) -> list[dict]:
        """오버라이드: 원천 데이터 수집"""
        raise NotImplementedError

    def transform(self, raw: list[dict]) -> list[dict]:
        """오버라이드: 데이터 변환 (기본: 그대로 반환)"""
        return raw

    def load(self, records: list[dict], table: str, schema: str = 'trading', batch_size: int = 100) -> int:
        """Supabase REST API로 INSERT (배치 처리)"""
        total = 0
        for start in range(0, len(records), batch_size):
            batch = records[start:start + batch_size]
            resp = httpx.post(
                f'{self.supabase_url}/rest/v1/{table}',
                headers=self._headers(schema),
                json=batch,
                timeout=60,
            )
            if resp.status_code in (200, 201):
                total += len(batch)
            elif resp.status_code == 409:
                total += len(batch)  # duplicate ignored
            else:
                print(f'  [WARN] {table} batch {start}: {resp.status_code} {resp.text[:100]}')
        return total

    def log(self, status: str, rows: int, error: Optional[str] = None) -> None:
        """sync_log에 실행 결과 기록"""
        duration = time.time() - (self._start_time or time.time())
        try:
            err_val = f"'{error[:500]}'" if error else 'NULL'
            query = (
                f"INSERT INTO trading.sync_log (job_name, status, rows_affected, error_message, finished_at) "
                f"VALUES ('{self.name}', '{status}', {rows}, {err_val}, NOW())"
            )
            httpx.post(
                f'{self.supabase_url}/rest/v1/rpc/exec_sql',
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json',
                },
                json={'query': query},
                timeout=30,
            )
        except Exception:
            pass  # 로그 실패는 무시

    def run(self, table: str, schema: str = 'trading') -> int:
        """extract → transform → load 실행 + 로그 기록"""
        self._start_time = time.time()
        try:
            raw = self.extract()
            records = self.transform(raw)
            loaded = self.load(records, table, schema)
            self.log('success', loaded)
            print(f'[{self.name}] {loaded}건 적재 완료')
            return loaded
        except Exception as e:
            self.log('error', 0, str(e))
            print(f'[{self.name}] 에러: {e}')
            raise
