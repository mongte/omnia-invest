# 퀀트 분석 파이프라인 구축 로그

## 작업 기간: 2026-04-06 ~ 2026-04-07

## 완료된 작업

### 1. 투자전략 DB 스키마 (완료)
- `trading.strategies` — 전략 마스터 (params JSONB, is_active)
- `trading.analysis_runs` — 분석 실행 이력
- `trading.strategy_signals` — 종목별 시그널
- RPC: `activate_strategy()`, `get_active_strategy()`, `get_latest_signals()`
- DB 에이전트로 마이그레이션 실행 완료

### 2. data-analysis 스킬 (완료)
- 위치: `.claude/skills/data-analysis/analyzer/`
- `base.py` — Supabase 데이터 로드 (stock_code 중복 제거)
- `indicators.py` — MA, RSI, MACD, BB, 이격도, 52주 위치
- `normalizers.py` — 4종 정규화 (Min-Max, Sigmoid, Percentile, Z-Score)
- `dynamic_weights.py` — IC가중 + 레짐스위칭(GMM) + ML메타모델 + EMA스무딩
- `scoring.py` — 3-Layer 동적 스코어링 + public.stock_scores 매핑 + NaN 방어
- `ml_predictor.py` — LightGBM 방향 예측, Purged K-Fold, 주간 자동 재학습
- `runner.py` — 파이프라인 실행 + public.stock_scores/ranking_history 동기화

### 3. 기본 전략 등록 (완료)
- `trading.strategies` id=1: "3-Layer 동적 스코어링 v1"
- 가중치: factor 0.3 + timing 0.3 + ml 0.4
- 임계값: Strong Buy ≥85, Buy ≥65, Hold ≥45, Sell ≥25

### 4. GitHub Actions 배치 (완료)
- `.github/workflows/daily-analysis.yml`
- 스케줄: KST 17:30 평일 (UTC 08:30)
- 스텝 1: `run_analysis.py` (스코어링)
- 스텝 2: `generate_summaries.py` (AI 공시 요약)
- Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY

### 5. 유니버스 확장 Top50 → Top200 (완료)
- `scripts/daily_sync_kiwoom.py` — TOP_N=200, DELAY_SEC=0.8, 페이지네이션
- `.claude/skills/trading-data-pipeline/api/kiwoom.py` — get_volume_ranking() 페이지네이션
- universe_type: volume_top200

### 6. OHLCV 백필 (완료)
- `scripts/backfill_ohlcv.py` — ka10081 기반 1년치 수집
- 103종목 × 평균 500일 = 51,461건 적재
- 92종목이 120일 이상 데이터 보유

### 7. quant 에이전트 (완료)
- `.claude/agents/quant.md` — 분석 실행/해석/전략 조정 오케스트레이터
- backend/strategy/database/frontend에 위임 판단

### 8. 에이전트 Activity Log 규칙 (완료)
- backend.md, frontend.md에 [작업 시작] / [작업 완료] 댓글 규칙 추가

### 9. 대시보드 고도화 태스크 (PM에 등록 완료)
- proj-1775448142187에 3개 태스크 등록
- [FE] 스코어 기반 종목 랭킹 정렬
- [BE]+[FE] AI 공시 요약 파이프라인 + UI
- [FE] 종목 상세 페이지 — 주가 차트 + 공시 마커

---

## 미완료 / 다음에 이어갈 작업

### AI 공시 요약 (크레딧 충전 필요)
- **상태**: 코드 완료, API 크레딧 부족으로 실행 안 됨
- **필요**: console.anthropic.com에서 $5 충전
- **충전 후**: GitHub Actions 수동 실행 → 650건 공시 요약 자동 생성
- **관련 파일**: `scripts/generate_summaries.py`

### 펀더멘털 re-sync
- **상태**: 4/6일자(일요일) 데이터 PER/PBR/ROE 전부 NULL
- **필요**: 평일 장 시작 후 `python3 scripts/daily_sync_kiwoom.py --job pre-market` 실행
- 또는 다음 영업일 07:50 launchd 자동 실행 시 자동 해결

### 대시보드 고도화 구현
- PM 태스크 등록 완료 → FE/BE 에이전트가 구현
- `@frontend proj-1775448142187` 또는 `@backend proj-1775448142187`으로 시작

### Liner 2차 프롬프트 (동적 스코어링 수학 모델)
- 프롬프트 준비 완료: `.claude/plans/purring-imagining-whistle.md` 하단 참조
- Liner에서 실행 → 결과로 scoring.py 동적 가중치 고도화

---

## 주요 파일 경로

### 분석 모듈
- `.claude/skills/data-analysis/analyzer/` — 전체 분석 파이프라인
- `.claude/skills/data-analysis/SKILL.md` — 스킬 문서
- `.claude/skills/data-analysis/migrations/strategy_tables.sql` — DB 마이그레이션

### 배치 스크립트
- `scripts/run_analysis.py` — 스코어링 실행 래퍼
- `scripts/generate_summaries.py` — AI 공시 요약 배치
- `scripts/backfill_ohlcv.py` — OHLCV 백필 (ka10081)
- `scripts/daily_sync_kiwoom.py` — 일일 동기화 (pre/post-market)

### 에이전트
- `.claude/agents/quant.md` — 분석 오케스트레이터
- `.claude/agents/strategy.md` — 전략 설계 (data-analysis 스킬)
- `.claude/agents/backend.md` — 코드 구현 (data-analysis 스킬)

### 리서치 보고서
- `doc/research/KOSPI-대형주-200종목-대상으로-멀티팩터-피처-+.pdf` — 1차 (팩터/파이프라인)
- `doc/research/KOSPI-200종목-대상-3-Laye.pdf` — 2차 (동적 가중치/정규화)

### 일일 배치 타임라인
```
07:50 launchd  → pre-market (Top200 종목 + 펀더멘털)
08:00 pg_cron  → OpenDART 공시 수집
16:30 launchd  → post-market (OHLCV 일봉)
17:30 Actions  → 스코어링 + AI 공시 요약
```
