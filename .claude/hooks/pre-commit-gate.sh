#!/bin/bash
# Pre-commit gate: git commit 전에 타입 체크 + FSD 검사
# exit 2 = 커밋 차단, exit 0 = 통과

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // "."')

# git commit 명령인지 확인
if ! echo "$COMMAND" | grep -qE 'git commit'; then
  exit 0
fi

ERRORS=""

# 1. FSD 레이어 검사
FSD_OUTPUT=$("$PROJECT_DIR/scripts/check-fsd-deps.sh" 2>&1)
FSD_EXIT=$?
if [ $FSD_EXIT -ne 0 ]; then
  ERRORS="${ERRORS}FSD 레이어 위반 발견:\n${FSD_OUTPUT}\n\n"
fi

# 2. TypeScript 타입 체크 (pharos-lab)
if [ -d "$PROJECT_DIR/apps/pharos-lab" ]; then
  TSC_OUTPUT=$(cd "$PROJECT_DIR/apps/pharos-lab" && npx tsc --noEmit 2>&1 | head -20)
  TSC_EXIT=$?
  if [ $TSC_EXIT -ne 0 ]; then
    ERRORS="${ERRORS}TypeScript 타입 에러 (pharos-lab):\n${TSC_OUTPUT}\n"
  fi
fi

if [ -n "$ERRORS" ]; then
  echo -e "$ERRORS" >&2
  exit 2
fi

exit 0
