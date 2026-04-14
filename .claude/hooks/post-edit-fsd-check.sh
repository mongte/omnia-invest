#!/bin/bash
# PostToolUse: Edit/Write 후 FSD 레이어 위반 비동기 검사
# 수정된 파일이 apps/*/src/ 내부일 때만 실행

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# apps/*/src/ 내부 파일인지 확인
if ! echo "$FILE_PATH" | grep -qE 'apps/[^/]+/src/'; then
  exit 0
fi

PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // "."')

# FSD 검사 실행
FSD_OUTPUT=$("$PROJECT_DIR/scripts/check-fsd-deps.sh" 2>&1)
FSD_EXIT=$?

if [ $FSD_EXIT -ne 0 ]; then
  # additionalContext로 에이전트에게 경고 전달
  jq -n --arg ctx "$FSD_OUTPUT" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $ctx
    }
  }'
fi

exit 0
