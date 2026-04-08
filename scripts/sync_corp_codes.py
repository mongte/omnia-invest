#!/usr/bin/env python3
"""
watch_universe의 모든 활성 종목에 corp_code를 일괄 매핑.

OpenDART corpCode.xml 파일을 다운로드하여 stock_code → corp_code 매핑 후
trading.watch_universe 테이블의 corp_code 컬럼을 업데이트한다.

Usage:
    python3 scripts/sync_corp_codes.py
"""

import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import time
import re
from pathlib import Path

import requests

# ─── 환경변수 로드 ────────────────────────────────────────────────────────────
def load_env(path: str) -> dict:
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r'^([A-Z_][A-Z0-9_]*)=(.*)$', line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env

dart_env = load_env(".claude/auth/opendart.env")
sb_env   = load_env("apps/pharos-lab/.env.local")

DART_API_KEY        = dart_env.get("DART_API_KEY") or os.getenv("DART_API_KEY", "")
SUPABASE_URL        = sb_env.get("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY        = sb_env.get("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml"
CACHE_DIR     = Path("/tmp/dart_cache")
CORP_CODE_XML = CACHE_DIR / "CORPCODE.xml"

# ─── corp_code.xml 다운로드 ────────────────────────────────────────────────────
def download_corp_code_xml() -> bool:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = CACHE_DIR / "corpcode.zip"

    print("OpenDART corpCode.xml 다운로드 중...")
    resp = requests.get(CORP_CODE_URL, params={"crtfc_key": DART_API_KEY}, timeout=60)
    resp.raise_for_status()

    with open(zip_path, "wb") as f:
        f.write(resp.content)

    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(CACHE_DIR)

    return CORP_CODE_XML.exists()

# ─── stock_code → corp_code 전체 매핑 빌드 ──────────────────────────────────
def build_mapping() -> dict[str, str]:
    if not CORP_CODE_XML.exists():
        if not download_corp_code_xml():
            print("[ERROR] corpCode.xml 다운로드 실패", file=sys.stderr)
            sys.exit(1)

    print("corp_code 매핑 빌드 중...")
    tree = ET.parse(CORP_CODE_XML)
    root = tree.getroot()

    mapping = {}
    for corp in root.findall("list"):
        sc = corp.find("stock_code")
        cc = corp.find("corp_code")
        if sc is not None and sc.text and sc.text.strip() and cc is not None and cc.text:
            mapping[sc.text.strip()] = cc.text.strip()

    print(f"  총 {len(mapping)}개 종목 매핑 로드 완료")
    return mapping

# ─── Supabase helpers ─────────────────────────────────────────────────────────
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def get_active_universe() -> list[dict]:
    url = f"{SUPABASE_URL}/rest/v1/watch_universe"
    resp = requests.get(
        url,
        headers=HEADERS,
        params={
            "select": "id,stock_code,corp_code",
            "schema": "trading",
            "is_active": "eq.true",
        },
        timeout=30,
    )
    # schema 헤더로 trading 스키마 사용
    resp2 = requests.get(
        url,
        headers={**HEADERS, "Accept-Profile": "trading"},
        params={"select": "id,stock_code,corp_code", "is_active": "eq.true"},
        timeout=30,
    )
    resp2.raise_for_status()
    return resp2.json()

def update_corp_code(stock_code: str, corp_code: str) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/watch_universe"
    resp = requests.patch(
        url,
        headers={**HEADERS, "Accept-Profile": "trading", "Content-Profile": "trading"},
        params={"stock_code": f"eq.{stock_code}"},
        json={"corp_code": corp_code},
        timeout=15,
    )
    return resp.status_code in (200, 204)

# ─── main ─────────────────────────────────────────────────────────────────────
def main():
    if not DART_API_KEY:
        print("[ERROR] DART_API_KEY 없음", file=sys.stderr)
        sys.exit(1)
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] Supabase 환경변수 없음", file=sys.stderr)
        sys.exit(1)

    mapping = build_mapping()

    print("watch_universe 활성 종목 조회 중...")
    universe = get_active_universe()
    print(f"  활성 종목: {len(universe)}개")

    # corp_code가 없는 종목만 대상
    targets = [u for u in universe if not u.get("corp_code")]
    print(f"  corp_code 누락: {len(targets)}개 → 업데이트 시작")

    ok = 0
    not_found = 0
    errors = 0

    for i, row in enumerate(targets, 1):
        sc = row["stock_code"]
        cc = mapping.get(sc)

        if not cc:
            not_found += 1
            if not_found <= 10:  # 처음 10개만 출력
                print(f"  [{i}/{len(targets)}] {sc} — OpenDART에 없음 (ETF/ETN 등)")
            continue

        success = update_corp_code(sc, cc)
        if success:
            ok += 1
        else:
            errors += 1
            print(f"  [{i}/{len(targets)}] {sc} — 업데이트 실패")

        if i % 50 == 0:
            print(f"  [{i}/{len(targets)}] 진행 중... (성공: {ok}, 미발견: {not_found})")

        time.sleep(0.05)  # Supabase rate limit 대응

    print()
    print("=" * 50)
    print(f"corp_code 동기화 완료")
    print(f"  업데이트 성공: {ok}건")
    print(f"  OpenDART 미발견(ETF/ETN 등): {not_found}건")
    print(f"  오류: {errors}건")


if __name__ == "__main__":
    main()
