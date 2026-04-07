"""
AI 공시 요약 배치 생성 스크립트

public.disclosures에서 llm_summaries가 없는 공시를 찾아
Claude Haiku로 요약을 생성하여 public.llm_summaries에 저장.

실행:
    python scripts/generate_summaries.py [--limit 50]

환경변수:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    ANTHROPIC_API_KEY
"""

import argparse
import json
import os
import sys
import time

import anthropic
import httpx
from discord_notifier import send_batch_notification


def get_supabase_client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[ERROR] SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요")
        sys.exit(1)
    return url, key


def get_pending_disclosures(url: str, key: str, limit: int = 50) -> list[dict]:
    """llm_summaries가 없는 공시 목록 조회."""
    # 이미 요약이 있는 disclosure_id 조회
    resp = httpx.get(
        f"{url}/rest/v1/llm_summaries?select=disclosure_id",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
        timeout=30,
    )
    existing_ids = {row["disclosure_id"] for row in resp.json()} if resp.status_code == 200 else set()

    # 전체 공시 조회 (최근순)
    resp = httpx.get(
        f"{url}/rest/v1/disclosures?order=disclosure_date.desc&limit={limit * 2}&select=id,stock_id,title,type,importance,disclosure_date",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"[ERROR] 공시 조회 실패: {resp.status_code}")
        return []

    all_disclosures = resp.json()
    pending = [d for d in all_disclosures if d["id"] not in existing_ids]
    return pending[:limit]


def generate_summary(client: anthropic.Anthropic, disclosure: dict) -> dict:
    """Claude Haiku로 공시 요약 생성."""
    title = disclosure["title"]
    disc_type = disclosure["type"]
    importance = disclosure["importance"]
    disc_date = disclosure["disclosure_date"]

    prompt = f"""한국 주식시장 공시를 분석하여 투자자에게 유용한 요약을 작성하세요.

공시 정보:
- 제목: {title}
- 유형: {disc_type}
- 중요도: {importance}
- 공시일: {disc_date}

다음 형식으로 JSON을 반환하세요:
{{
  "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "sentiment": "positive 또는 negative 또는 neutral",
  "impact": "주가에 미치는 영향 1~2문장"
}}

규칙:
- points는 반드시 3개, 각 20자 이내
- sentiment는 투자자 관점에서 판단
- impact는 구체적 영향 기술
- JSON만 반환, 다른 텍스트 없이"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()
    # JSON 파싱 (```json ... ``` 래핑 제거)
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    return json.loads(text)


def save_summary(url: str, key: str, disclosure_id: str, summary: dict) -> bool:
    """llm_summaries에 저장."""
    record = {
        "disclosure_id": disclosure_id,
        "points": summary.get("points", []),
        "sentiment": summary.get("sentiment", "neutral"),
        "impact": summary.get("impact", ""),
        "model": "claude-haiku-4-5-20251001",
    }

    resp = httpx.post(
        f"{url}/rest/v1/llm_summaries",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        json=record,
        timeout=30,
    )
    return resp.status_code in (200, 201)


def main():
    parser = argparse.ArgumentParser(description="AI 공시 요약 배치 생성")
    parser.add_argument("--limit", type=int, default=50, help="최대 처리 건수")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[ERROR] ANTHROPIC_API_KEY 필요")
        sys.exit(1)

    url, key = get_supabase_client()
    client = anthropic.Anthropic(api_key=api_key)

    # 미생성 공시 조회
    started = time.time()
    pending = get_pending_disclosures(url, key, limit=args.limit)
    print(f"요약 미생성 공시: {len(pending)}건")

    if not pending:
        print("생성할 공시 없음. 종료.")
        send_batch_notification('generate-summaries', 'success', 0, time.time() - started)
        return

    success = 0
    failed = 0

    for i, disc in enumerate(pending):
        try:
            summary = generate_summary(client, disc)
            if save_summary(url, key, disc["id"], summary):
                success += 1
                print(f"  [{i+1:03d}/{len(pending)}] {disc['title'][:30]}... → {summary['sentiment']}")
            else:
                failed += 1
                print(f"  [{i+1:03d}/{len(pending)}] {disc['title'][:30]}... → DB 저장 실패")
        except Exception as e:
            failed += 1
            print(f"  [{i+1:03d}/{len(pending)}] {disc['title'][:30]}... → ERROR: {e}")

        # rate limit 대응
        if i < len(pending) - 1:
            time.sleep(0.5)

    elapsed = time.time() - started
    print(f"\n완료: 성공 {success}건, 실패 {failed}건")

    status = 'success' if failed == 0 else 'partial'
    send_batch_notification('generate-summaries', status, success, elapsed, extra_fields=[
        {'name': 'Failed', 'value': str(failed), 'inline': True},
    ])


if __name__ == "__main__":
    main()
