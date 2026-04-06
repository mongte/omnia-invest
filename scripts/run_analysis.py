"""
GitHub Actions용 분석 실행 래퍼.

환경변수:
  SUPABASE_URL — Supabase 프로젝트 URL
  SUPABASE_SERVICE_ROLE_KEY — service_role 키

실행:
  python scripts/run_analysis.py [YYYY-MM-DD]
"""

import os
import sys
from datetime import date
from pathlib import Path

# analyzer 모듈 경로 추가
SKILL_DIR = Path(__file__).resolve().parent.parent / ".claude" / "skills" / "data-analysis"
sys.path.insert(0, str(SKILL_DIR))

# 환경변수 검증
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not url or not key:
    print("[ERROR] SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수 필요")
    sys.exit(1)

from analyzer.runner import AnalysisRunner

run_date = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()

print(f"=== 일일 분석 시작: {run_date} ===")
runner = AnalysisRunner()
results = runner.run(run_date)

print(f"\n{'='*60}")
print(f"분석 완료: {len(results)}종목 | 기준일: {run_date}")
print(f"{'='*60}")
print(f"{'순위':>4} {'종목코드':>8} {'시그널':>12} {'점수':>6}")
print(f"{'-'*40}")
for r in results[:20]:
    print(f"{r.rank:>4} {r.stock_code:>8} {r.signal:>12} {r.total_score:>6.1f}")

# 시그널 요약
from collections import Counter
signals = Counter(r.signal for r in results)
print(f"\n시그널 분포: {dict(signals)}")
print(f"public.stock_scores 동기화 완료")
print(f"public.ranking_history 동기화 완료")
