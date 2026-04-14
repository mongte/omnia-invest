#!/bin/bash
# 파일 크기 제한 검사
# 에이전트가 읽고 분해(decompose)할 수 있도록 명확한 가이드 제공
#
# 기준:
#   300줄 초과 → WARNING (권장 분해)
#   500줄 초과 → ERROR (필수 분해)

WARN_LIMIT=300
ERROR_LIMIT=500
WARNINGS=0
ERRORS=0

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

echo "파일 크기 검사 중... (경고: ${WARN_LIMIT}줄, 에러: ${ERROR_LIMIT}줄)"

while IFS= read -r -d '' file; do
  line_count=$(wc -l < "$file")
  rel_path="${file#$ROOT/}"

  if [ "$line_count" -gt "$ERROR_LIMIT" ]; then
    echo ""
    echo "❌ ERROR: ${rel_path} — ${line_count}줄 (상한 ${ERROR_LIMIT}줄 초과)"
    echo "   수정 방법: 파일을 더 작은 단위로 분해하세요"
    echo "   예시: 컴포넌트 분리, 훅 추출, 유틸 분리"
    ERRORS=$((ERRORS + 1))
  elif [ "$line_count" -gt "$WARN_LIMIT" ]; then
    echo ""
    echo "⚠️  WARNING: ${rel_path} — ${line_count}줄 (권장 ${WARN_LIMIT}줄 초과)"
    echo "   권고: 파일 분해를 고려하세요"
    WARNINGS=$((WARNINGS + 1))
  fi
done < <(find "$ROOT/apps" -path "*/src/*.ts" -print0 -o -path "*/src/*.tsx" -print0 2>/dev/null | \
         grep -zv "node_modules" | \
         grep -zv ".spec." | \
         grep -zv ".test." | \
         grep -zv ".d.ts")

echo ""
echo "검사 완료: 에러 ${ERRORS}건, 경고 ${WARNINGS}건"

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
exit 0
