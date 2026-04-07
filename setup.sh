#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
step()  { echo -e "\n${BOLD}▶ $1${NC}"; }

echo -e "${BOLD}=== omnia-invest 프로젝트 세팅 ===${NC}"
echo "  PROJECT_ROOT: $PROJECT_ROOT"
echo ""

# ─── 1. 사전 요구사항 확인 ──────────────────────────────────────────────────

step "사전 요구사항 확인"

NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo "0")
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20+ 필요 (현재: $(node --version 2>/dev/null || echo '미설치'))"
    echo "   설치: https://nodejs.org 또는 nvm install 20"
    exit 1
fi
info "Node.js $(node --version)"

PYTHON_BIN=""
for cmd in python3.12 python3.13 python3; do
    if command -v "$cmd" &>/dev/null; then
        PY_MAJOR=$($cmd --version 2>&1 | awk '{print $2}' | cut -d. -f1)
        PY_MINOR=$($cmd --version 2>&1 | awk '{print $2}' | cut -d. -f2)
        if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 12 ]; then
            PYTHON_BIN="$cmd"
            break
        fi
    fi
done

if [ -z "$PYTHON_BIN" ]; then
    error "Python 3.12+ 필요"
    echo "   설치: https://www.python.org 또는 brew install python@3.12"
    exit 1
fi
info "Python $($PYTHON_BIN --version)"

# ─── 2. Node.js 의존성 설치 ─────────────────────────────────────────────────

step "Node.js 의존성 설치"

npm install
info "루트 node_modules 설치 완료"

# pharos-lab은 자체 node_modules 필요
if [ -f "apps/pharos-lab/package.json" ]; then
    cd apps/pharos-lab && npm install && cd "$PROJECT_ROOT"
    info "pharos-lab node_modules 설치 완료"
fi

# ─── 3. 환경 변수 파일 생성 ─────────────────────────────────────────────────

step "환경 변수 파일 생성"

copy_env() {
    local example="$1"
    local target="$2"
    if [ -f "$target" ]; then
        warn "$(basename "$target") 이미 존재 — 스킵 (수동 확인 필요)"
    elif [ -f "$example" ]; then
        cp "$example" "$target"
        info "$(basename "$target") 생성됨 — 실제 값으로 채워주세요"
    else
        warn "$example 파일을 찾을 수 없음"
    fi
}

copy_env ".env.example"                        ".env"
copy_env "apps/pharos-lab/.env.example"        "apps/pharos-lab/.env.local"
copy_env "apps/task-manager/.env.example"      "apps/task-manager/.env.local"

# ─── 4. 키움 인증 파일 ──────────────────────────────────────────────────────

step "키움 API 인증 파일 설정"

mkdir -p ".claude/auth"
if [ -f ".claude/auth/kiwoom.env" ]; then
    warn ".claude/auth/kiwoom.env 이미 존재 — 스킵"
elif [ -f ".claude/auth/kiwoom.env.example" ]; then
    cp ".claude/auth/kiwoom.env.example" ".claude/auth/kiwoom.env"
    info ".claude/auth/kiwoom.env 생성됨 — API 키를 채워주세요"
fi

# ─── 5. Python 가상환경 & 의존성 ────────────────────────────────────────────

step "Python 가상환경 구성"

if [ ! -d "scripts/.venv" ]; then
    "$PYTHON_BIN" -m venv scripts/.venv
    info "가상환경 생성: scripts/.venv"
else
    warn "scripts/.venv 이미 존재 — 스킵"
fi

scripts/.venv/bin/pip install --quiet --upgrade pip
scripts/.venv/bin/pip install --quiet httpx
scripts/.venv/bin/pip install --quiet -r scripts/requirements-analysis.txt
info "Python 패키지 설치 완료"

# ─── 6. launchd 스케줄러 (macOS 전용, 선택) ────────────────────────────────

if [[ "$OSTYPE" == "darwin"* ]]; then
    step "launchd 스케줄러 설정 (선택)"
    echo "  키움 데이터 수집 스케줄러를 등록하시겠습니까?"
    echo "  - 평일 07:50 KST: pre-market (Top50 갱신)"
    echo "  - 평일 16:30 KST: post-market (일봉 수집)"
    echo ""
    read -p "  스케줄러를 설치하시겠습니까? (y/n): " INSTALL_LAUNCHD
    if [ "$INSTALL_LAUNCHD" = "y" ] || [ "$INSTALL_LAUNCHD" = "Y" ]; then
        bash scripts/launchd/install.sh
    else
        info "스케줄러 설치 건너뜀 — 나중에 bash scripts/launchd/install.sh 로 설치 가능"
    fi
fi

# ─── 완료 ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}=== 세팅 완료 ===${NC}"
echo ""
echo "  다음 단계:"
echo "  1. 환경 변수 파일에 실제 값을 입력하세요:"
echo "     - apps/pharos-lab/.env.local  (Supabase URL/KEY)"
echo "     - apps/task-manager/.env.local (Google Service Account)"
echo "     - .env                         (Discord webhook, 선택)"
echo "     - .claude/auth/kiwoom.env      (키움 API 키)"
echo ""
echo "  2. 앱 실행:"
echo "     npm run dev:pharos-lab    # localhost:3000"
echo "     npm run dev:task-manager  # localhost:4200"
echo ""
echo "  상세 가이드: SETUP.md"
