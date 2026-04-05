---
name: auth-manager
description: 외부 서비스 API 키 및 인증 정보 관리 가이드 (키움증권, OpenDART, Supabase, LLM 서비스)
tags:
  - auth
  - api-key
  - credentials
  - common
---

# Auth Manager

omnia-invest 프로젝트의 외부 서비스 API 키 및 인증 정보를 안전하게 관리하는 방법을 안내합니다.

---

## 환경변수 세팅 전 경로 선택

> **환경변수 세팅 요청 시 반드시 아래 선택지를 먼저 출력하고 사용자의 선택을 받아야 합니다.**

### 공통 서비스 (키움증권, OpenDART, LLM 서비스)

```
인증 파일을 어디에 저장하시겠습니까?

1. Global   — ~/.claude/auth/
             (모든 프로젝트에서 공유, 재사용 가능)

2. Project  — omnia-invest/.claude/auth/
             (이 프로젝트 전용, 팀 공유 시 주의)
```

선택에 따라 아래 경로를 사용합니다:

| 선택 | 경로 |
| --- | --- |
| 1. Global | `~/.claude/auth/<service>.env` |
| 2. Project | `omnia-invest/.claude/auth/<service>.env` |

### Supabase (앱별 관리)

```
Supabase 환경변수를 어떤 앱에 설정하시겠습니까?

1. apps/pharos-lab
2. apps/task-manager
```

선택에 따라 `.env.local` 파일에 저장합니다:

| 선택 | 경로 |
| --- | --- |
| 1. pharos-lab | `omnia-invest/apps/pharos-lab/.env.local` |
| 2. task-manager | `omnia-invest/apps/task-manager/.env.local` |

---

## 지원 서비스

### 투자 데이터 서비스

| 서비스 | 용도 | 환경변수 | 인증 방식 | 발급 URL |
| --- | --- | --- | --- | --- |
| 키움증권 REST API | 주식 데이터 조회, 계좌 관리 | `TRADING_ENV`, `KIWOOM_REST_API_KEY`, `KIWOOM_REST_API_SECRET`, `KIWOOM_ACCOUNT_NO` | OAuth 2.0 client_credentials | https://openapi.kiwoom.com |
| OpenDART | 공시 정보, 재무제표 | `DART_API_KEY` | Query parameter | https://opendart.fss.or.kr |

### 인프라 서비스 — Supabase (앱별 관리)

Supabase 대시보드 **Settings > API Keys** 기준으로 분류합니다.

**Project URL**:

| 환경변수 | 대시보드 위치 | 노출 범위 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | 브라우저 + 서버 |

**Publishable API Keys** (anon public — 브라우저 노출 가능):

| 환경변수 | 대시보드 위치 | 노출 범위 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API Keys > `anon` `public` | 브라우저 + 서버 (RLS 적용) |

**Secret API Keys** (service_role secret — 절대 브라우저 노출 금지):

| 환경변수 | 대시보드 위치 | 노출 범위 |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | API Keys > `service_role` `secret` | 서버/터미널 전용 (RLS 우회) |

> 관리 위치: `omnia-invest/apps/<app>/.env.local` (앱별 분리)

### LLM 서비스

| 서비스 | 용도 | 환경변수 | 발급 URL |
| --- | --- | --- | --- |
| OpenRouter | LLM API 라우팅 | `OPENROUTER_API_KEY` | https://openrouter.ai |
| OpenAI | GPT API | `OPENAI_API_KEY` | https://platform.openai.com |
| Anthropic | Claude API | `ANTHROPIC_API_KEY` | https://console.anthropic.com |

---

## 인증 관리 방법

### 공통 서비스: Global 경로 선택 시

```
~/.claude/auth/
├── kiwoom.env          # 키움증권 API 키
├── opendart.env        # OpenDART API 키
├── openrouter.env      # OpenRouter API 키
├── openai.env          # OpenAI API 키
└── anthropic.env       # Anthropic API 키
```

### 공통 서비스: Project 경로 선택 시

```
omnia-invest/.claude/auth/
├── kiwoom.env          # 키움증권 API 키
├── opendart.env        # OpenDART API 키
├── openrouter.env      # OpenRouter API 키
├── openai.env          # OpenAI API 키
└── anthropic.env       # Anthropic API 키
```

> `omnia-invest/.claude/auth/` 는 `.gitignore`에 반드시 추가할 것.

#### 키움증권 설정

```bash
# <AUTH_DIR>/kiwoom.env
TRADING_ENV=mock                          # mock(모의투자) | prod(실전투자)
KIWOOM_REST_API_KEY=your_api_key_here
KIWOOM_REST_API_SECRET=your_api_secret_here
KIWOOM_ACCOUNT_NO=your_account_number     # 모의투자 계좌는 50으로 시작
```

#### OpenDART 설정

```bash
# <AUTH_DIR>/opendart.env
DART_API_KEY=your_api_key_here
```

### Supabase: 앱별 관리

모노레포 특성상 각 앱이 독립된 Supabase 프로젝트를 가질 수 있으므로 앱 디렉토리에서 관리합니다.

```
omnia-invest/apps/
├── pharos-lab/
│   ├── .env.local          # 로컬 개발용 (git 제외)
│   └── .env.example        # 팀 공유용 템플릿 (git 포함)
└── task-manager/
    ├── .env.local
    └── .env.example
```

#### 환경별 Supabase 구성

각 앱에 dev/prod 두 개의 Supabase 프로젝트를 운영합니다.

```bash
# omnia-invest/apps/pharos-lab/.env.local (로컬 개발 — dev 프로젝트)

# --- API URL ---
NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co

# --- API Keys (앱 통신용) ---
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...dev

# --- Secret Keys (터미널/스크립트 전용) ---
SUPABASE_SERVICE_ROLE_KEY=eyJ...dev-service
```

```bash
# omnia-invest/apps/pharos-lab/.env.production (프로덕션 — prod 프로젝트)

# --- API URL ---
NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co

# --- API Keys (앱 통신용) ---
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...prod

# --- Secret Keys (터미널/스크립트 전용) ---
SUPABASE_SERVICE_ROLE_KEY=eyJ...prod-service
```

#### .env.example 템플릿

```bash
# omnia-invest/apps/pharos-lab/.env.example

# --- API URL ---
NEXT_PUBLIC_SUPABASE_URL=

# --- API Keys (앱 통신용: 브라우저 노출 가능) ---
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# --- Secret Keys (터미널/스크립트 전용: 브라우저 노출 절대 금지) ---
SUPABASE_SERVICE_ROLE_KEY=
```

> **사용 구분**: 앱(Next.js)에서 DB 통신 시 `ANON_KEY` 사용. 터미널에서 데이터 배치 적재/마이그레이션 시 `SERVICE_ROLE_KEY` 사용.

---

## 서비스별 인증 가이드

### 키움증권 REST API

**인증 흐름**: OAuth 2.0 client_credentials → Bearer 토큰

| `TRADING_ENV` | Base URL | 용도 |
| --- | --- | --- |
| `mock` | `https://mockapi.kiwoom.com` | 모의투자 (안전) |
| `prod` | `https://api.kiwoom.com` | 실전투자 (주의) |

- 토큰 유효시간 약 1시간, 만료 시 재발급 필요
- 실전투자 시 openapi.kiwoom.com에서 IP 등록 필수

### OpenDART

**인증 흐름**: 매 요청 쿼리 파라미터 `crtfc_key` 전달

- 일일 호출 한도: 10,000건
- 별도 토큰 관리 불필요

### Supabase

**대시보드 Settings > API Keys 기준**:

| 대시보드 분류 | 환경변수 | 사용처 | 비고 |
| --- | --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | 앱 + 스크립트 공용 | — |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js 앱 통신 (브라우저/서버) | RLS 적용 |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | 터미널 스크립트, 데이터 배치 적재 | RLS 우회, 브라우저 노출 금지 |

---

## 환경 파일 로드

```bash
# Global 경로 전체 로드
for f in ~/.claude/auth/*.env; do source "$f"; done

# Project 경로 전체 로드
for f in omnia-invest/.claude/auth/*.env; do source "$f"; done

# 단일 서비스 (경로는 선택한 방식에 따라 변경)
source ~/.claude/auth/kiwoom.env
# 또는
source omnia-invest/.claude/auth/kiwoom.env
```

```python
from dotenv import load_dotenv
import os

# Global 경로
load_dotenv(os.path.expanduser("~/.claude/auth/kiwoom.env"))

# 또는 Project 경로
load_dotenv("omnia-invest/.claude/auth/kiwoom.env")
```

---

## 보안 가이드라인

### 권장 사항

1. **Git 제외**: `.env`, `.env.local`, `.claude/auth/` 를 `.gitignore`에 추가
2. **파일 권한**: `chmod 600 ~/.claude/auth/*.env` 또는 `chmod 600 omnia-invest/.claude/auth/*.env`
3. **실전/모의 분리**: `TRADING_ENV`는 기본값 `mock` 유지, 실전 시에만 `prod` 전환
4. **앱별 격리**: Supabase 키는 앱 디렉토리에서만 관리, 루트 `.env`에 두지 않기

### 금지 사항

- API 키를 코드에 하드코딩
- API 키를 Git에 커밋
- `SUPABASE_SERVICE_ROLE_KEY`를 클라이언트 코드에 노출
- `TRADING_ENV=prod` 상태에서 테스트 코드 실행

---

## 문제 해결

### 키움증권

| 오류 | 원인 | 해결 |
| --- | --- | --- |
| 401 | 잘못된 API 키/시크릿 | openapi.kiwoom.com에서 키 재확인 |
| 8050 | IP 미등록 (실전투자) | openapi.kiwoom.com에서 서버 IP 등록 |
| 토큰 만료 | 1시간 경과 | 토큰 재발급 |

### OpenDART

| 오류 | 원인 | 해결 |
| --- | --- | --- |
| status ≠ 000 | API 키 또는 파라미터 오류 | 응답 메시지 확인 |
| 일일 한도 초과 | 10,000건 초과 | 다음 날 0시 이후 재시도 |

### Supabase

| 오류 | 원인 | 해결 |
| --- | --- | --- |
| 401 Unauthorized | anon key 오류 또는 RLS 정책 | 대시보드에서 키 재확인 |
| connection refused | URL 오류 | `NEXT_PUBLIC_SUPABASE_URL` 확인 |
| .env.local 미적용 | Next.js 캐시 | `next dev` 재시작 |

---

## 관련 스킬

- `kiwoom-api`: 키움증권 REST API 사용 가이드
- `opendart-api`: OpenDART 공시 데이터 조회 가이드
- `supabase-postgres-best-practices`: Supabase/Postgres 쿼리 최적화 가이드
