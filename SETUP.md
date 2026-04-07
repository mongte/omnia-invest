# omnia-invest 세팅 가이드

## 사전 요구사항

| 항목 | 버전 | 설치 |
|------|------|------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) 또는 `nvm install 20` |
| Python | 3.12+ | [python.org](https://www.python.org) 또는 `brew install python@3.12` |
| npm | 10+ | Node.js에 포함 |

---

## 빠른 시작

```bash
git clone <repo-url>
cd omnia-invest
./setup.sh
```

스크립트가 자동으로 수행:
- Node.js / Python 버전 확인
- `npm install` (루트 + 각 앱)
- `.env.example` → `.env.local` 복사
- Python 가상환경 생성 + 패키지 설치
- launchd 스케줄러 설치 여부 확인 (macOS)

---

## 수동 세팅

### 1. 의존성 설치

```bash
# Node.js (루트 + pharos-lab 별도 설치 필요)
npm install
cd apps/pharos-lab && npm install && cd ../..

# Python 가상환경
python3 -m venv scripts/.venv
source scripts/.venv/bin/activate
pip install httpx
pip install -r scripts/requirements-analysis.txt
```

### 2. 환경 변수 설정

```bash
cp apps/pharos-lab/.env.example apps/pharos-lab/.env.local
cp apps/task-manager/.env.example apps/task-manager/.env.local
cp .env.example .env
mkdir -p .claude/auth
cp .claude/auth/kiwoom.env.example .claude/auth/kiwoom.env
```

각 파일을 열어 실제 값으로 채워주세요 (아래 "환경 변수 설명" 참조).

### 3. 앱 실행

```bash
npm run dev:pharos-lab    # http://localhost:3000
npm run dev:task-manager  # http://localhost:4200
```

---

## 환경 변수 설명

### `apps/pharos-lab/.env.local`

| 변수 | 설명 | 발급 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase 대시보드 > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 anon 키 | 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 service role 키 | 동일 (절대 클라이언트에 노출 금지) |

### `apps/task-manager/.env.local`

| 변수 | 설명 | 발급 |
|------|------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google 서비스 계정 이메일 | Google Cloud Console > IAM > 서비스 계정 |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | 서비스 계정 JSON 키 파일 경로 | 동일 (키 생성 후 다운로드) |

> Google 서비스 계정 JSON 키 파일(`omnia-invest-key.json` 등)은 프로젝트 루트에 위치시키고,  
> `.gitignore`의 `omnia-invest-*-*.json` 패턴으로 자동 제외됩니다.

### `.env` (루트)

| 변수 | 설명 | 발급 |
|------|------|------|
| `DISCORD_WEBHOOK_URL` | 배치 알림용 Discord Webhook (선택) | Discord 서버 설정 > 연동 > 웹훅 |

### `.claude/auth/kiwoom.env`

| 변수 | 설명 | 발급 |
|------|------|------|
| `KIWOOM_REST_API_KEY` | 키움증권 REST API 앱 키 | [apiportal.kiwoom.com](https://apiportal.kiwoom.com) > 앱 등록 |
| `KIWOOM_REST_API_SECRET` | 키움증권 REST API 앱 시크릿 | 동일 |

> **⚠️ IP 제한**: 키움 REST API는 등록된 IP에서만 호출 가능합니다.  
> 새 PC 사용 시 apiportal.kiwoom.com에서 IP 화이트리스트를 갱신해야 합니다.

---

## 데이터 파이프라인

### 로컬 파이프라인 (키움 API — IP 제한 있음)

| 시간 (KST) | 스크립트 | 역할 |
|-----------|---------|------|
| 평일 07:50 | `daily_sync_kiwoom.py --job pre-market` | Top200 종목 갱신 + 기본정보 |
| 평일 16:30 | `daily_sync_kiwoom.py --job post-market` | 일봉(ka10081) + 종가 업데이트 |

수동 실행:
```bash
source scripts/.venv/bin/activate
python3 scripts/daily_sync_kiwoom.py --job pre-market
python3 scripts/daily_sync_kiwoom.py --job post-market
```

### Supabase Edge Functions (IP 제한 없음)

| 일정 | 함수 | 역할 |
|------|------|------|
| 평일 08:00 KST | `daily-sync-opendart` | 공시 수집 + public 동기화 |
| 매월 15일 | `monthly-financial-sync` | 분기 재무제표 |
| 일요일 0시 | `weekly-cleanup` | 오래된 데이터 정리 |

이 함수들은 Supabase pg_cron으로 자동 실행됩니다. 별도 설정 불필요.

---

## 스케줄러 설정 (macOS)

### 설치

```bash
bash scripts/launchd/install.sh
```

### 확인

```bash
launchctl list | grep omnia
```

### 해제

```bash
launchctl unload ~/Library/LaunchAgents/com.omnia.pre-market.plist
launchctl unload ~/Library/LaunchAgents/com.omnia.post-market.plist
```

> 절전 모드 중에도 스케줄러가 실행되려면:  
> 시스템 설정 > 에너지 절약 > "절전 모드 사용 안 함" 활성화 권장

---

## CI/CD (GitHub Actions)

`.github/workflows/daily-analysis.yml`이 평일 17:30 KST에 자동으로 종목 분석 + LLM 요약을 실행합니다.

필요한 GitHub Secrets (Settings > Secrets > Actions):

| 시크릿 이름 | 내용 |
|------------|------|
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` 값 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role 키 |
| `ANTHROPIC_API_KEY` | Claude API 키 |

---

## 트러블슈팅

### `npm install` 실패

```bash
# Node.js 버전 확인
node --version  # 20+ 필요

# npm cache 초기화
npm cache clean --force
npm install
```

### pharos-lab이 `NEXT_PUBLIC_SUPABASE_URL is not defined` 오류

`apps/pharos-lab/.env.local`에 Supabase 환경변수가 제대로 설정되었는지 확인.

### Python 스크립트가 `kiwoom.env: No such file or directory` 오류

```bash
mkdir -p .claude/auth
cp .claude/auth/kiwoom.env.example .claude/auth/kiwoom.env
# 파일을 열어 실제 API 키 입력
```

### 키움 API 401 / IP 오류

새 PC의 공인 IP를 [apiportal.kiwoom.com](https://apiportal.kiwoom.com) > 앱 관리 > IP 화이트리스트에 추가해야 합니다.

### launchd 스케줄러가 실행되지 않음

```bash
# 로그 확인
tail -f scripts/logs/pre-market.log
tail -f scripts/logs/pre-market.err

# 재등록
bash scripts/launchd/install.sh
```
