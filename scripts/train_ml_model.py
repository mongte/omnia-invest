"""
ML 모델 학습 스크립트

trading.ohlcv_daily + trading.stock_fundamentals 데이터로
LightGBM 방향 예측 모델을 학습합니다.

실행:
    python scripts/train_ml_model.py

결과:
    .claude/skills/data-analysis/models/lgbm_direction.pkl
    .claude/skills/data-analysis/models/lgbm_meta.json
"""

import os
import sys
from pathlib import Path

# 프로젝트 루트
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SKILL_DIR = PROJECT_ROOT / ".claude" / "skills" / "data-analysis"
sys.path.insert(0, str(SKILL_DIR))

# 환경변수 로드 (.env.local)
ENV_FILE = PROJECT_ROOT / "apps" / "pharos-lab" / ".env.local"


def load_env(path: Path) -> dict[str, str]:
    env = {}
    if not path.exists():
        return env
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip("'\"")
    return env


def main():
    import httpx
    import numpy as np
    import pandas as pd

    env = load_env(ENV_FILE)
    url = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("[ERROR] Supabase 환경변수 없음")
        sys.exit(1)

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
        "Accept-Profile": "trading",
        "Content-Profile": "trading",
    }

    # 1. OHLCV 전체 로드
    print("=== OHLCV 데이터 로드 ===")
    ohlcv_rows = []
    offset = 0
    batch = 1000
    while True:
        resp = httpx.get(
            f"{url}/rest/v1/ohlcv_daily?select=stock_code,trade_date,open_price,high_price,low_price,close_price,volume&order=stock_code,trade_date&offset={offset}&limit={batch}",
            headers=headers,
            timeout=60,
        )
        if resp.status_code != 200:
            print(f"[ERROR] OHLCV 조회 실패: {resp.status_code}")
            sys.exit(1)
        data = resp.json()
        if not data:
            break
        ohlcv_rows.extend(data)
        offset += batch
        print(f"  로드: {len(ohlcv_rows)}건...", end="\r")

    print(f"\nOHLCV 총 {len(ohlcv_rows)}건 로드")

    # stock_code별 DataFrame 구성
    df_all = pd.DataFrame(ohlcv_rows)
    df_all = df_all.rename(columns={
        "open_price": "open",
        "high_price": "high",
        "low_price": "low",
        "close_price": "close",
    })
    df_all["trade_date"] = pd.to_datetime(df_all["trade_date"])
    df_all = df_all.sort_values(["stock_code", "trade_date"])

    ohlcv_dict: dict[str, pd.DataFrame] = {}
    for code, group in df_all.groupby("stock_code"):
        ohlcv_dict[str(code)] = group.reset_index(drop=True)

    print(f"종목 수: {len(ohlcv_dict)}")
    lengths = [len(v) for v in ohlcv_dict.values()]
    print(f"종목당 데이터: min={min(lengths)}, max={max(lengths)}, avg={np.mean(lengths):.0f}")

    # 2. 펀더멘털 로드
    print("\n=== 펀더멘털 데이터 로드 ===")
    resp = httpx.get(
        f"{url}/rest/v1/stock_fundamentals?select=stock_code,per,pbr,roe,foreign_ratio,market_cap&order=stock_code",
        headers=headers,
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"[WARN] 펀더멘털 조회 실패: {resp.status_code}, 펀더멘털 없이 진행")
        fundamentals_df = pd.DataFrame(columns=["stock_code", "per", "pbr", "roe", "foreign_ratio", "market_cap"])
    else:
        fundamentals_df = pd.DataFrame(resp.json())
        print(f"펀더멘털: {len(fundamentals_df)}건")

    # 3. 모델 학습
    print("\n=== ML 모델 학습 시작 ===")
    from analyzer.ml_predictor import MLPredictor

    predictor = MLPredictor(lookforward=5)
    try:
        meta = predictor.train(ohlcv_dict, fundamentals_df, min_samples=200)
        print(f"\n{'='*60}")
        print(f"학습 완료!")
        print(f"  샘플 수: {meta['n_samples']}건")
        print(f"  피처 수: {meta['n_features']}개")
        print(f"  CV 정확도: {meta['cv_accuracy_mean']:.4f} (±{meta['cv_accuracy_std']:.4f})")
        print(f"  예측 기간: {meta['lookforward']}일")
        print(f"  학습 날짜: {meta['train_date']}")
        print(f"\n피처 중요도 Top 10:")
        importance = sorted(meta["feature_importance"].items(), key=lambda x: x[1], reverse=True)
        for feat, imp in importance[:10]:
            print(f"  {feat:20s} {imp:>6d}")
        print(f"\n모델 저장: {SKILL_DIR / 'models' / 'lgbm_direction.pkl'}")
    except ValueError as e:
        print(f"[ERROR] 학습 실패: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
