#!/bin/bash
# FSD 레이어 의존성 검사
# 에이전트가 읽고 수정할 수 있도록 명확한 에러 메시지 출력
#
# 허용 방향: app → views → widgets → features → entities → shared
# 금지: 하위 레이어가 상위 레이어를 import

set -e

VIOLATIONS=0
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

check_forbidden_imports() {
  local file="$1"
  local layer="$2"
  shift 2
  local forbidden=("$@")

  for pattern in "${forbidden[@]}"; do
    # grep: 줄번호 포함 출력
    matches=$(grep -n "from ['\"]${pattern}" "$file" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo ""
      echo "❌ FSD 위반: ${layer}에서 상위 레이어 import 금지"
      echo "   파일: ${file#$ROOT/}"
      echo "   금지 패턴: ${pattern}"
      echo "   위반 라인:"
      while IFS= read -r line; do
        echo "     $line"
      done <<< "$matches"
      echo "   수정 방법: 이벤트 버스나 콜백 패턴으로 우회하세요"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
}

# entities/ 파일 검사: features, widgets, views import 금지
for app_dir in "$ROOT"/apps/*/src; do
  [ -d "$app_dir/entities" ] || continue
  while IFS= read -r -d '' file; do
    check_forbidden_imports "$file" "entities" \
      "@/features/" "@/widgets/" "@/views/" \
      "~/features/" "~/widgets/" "~/views/"
  done < <(find "$app_dir/entities" -name "*.ts" -o -name "*.tsx" -print0 2>/dev/null)
done

# shared/ 파일 검사: entities 이상 레이어 import 금지
for app_dir in "$ROOT"/apps/*/src; do
  [ -d "$app_dir/shared" ] || continue
  while IFS= read -r -d '' file; do
    check_forbidden_imports "$file" "shared" \
      "@/entities/" "@/features/" "@/widgets/" "@/views/" \
      "~/entities/" "~/features/" "~/widgets/" "~/views/"
  done < <(find "$app_dir/shared" -name "*.ts" -o -name "*.tsx" -print0 2>/dev/null)
done

# features/ 파일 검사: widgets, views import 금지
for app_dir in "$ROOT"/apps/*/src; do
  [ -d "$app_dir/features" ] || continue
  while IFS= read -r -d '' file; do
    check_forbidden_imports "$file" "features" \
      "@/widgets/" "@/views/" \
      "~/widgets/" "~/views/"
  done < <(find "$app_dir/features" -name "*.ts" -o -name "*.tsx" -print0 2>/dev/null)
done

echo ""
if [ "$VIOLATIONS" -eq 0 ]; then
  echo "✅ FSD 레이어 의존성 검사 통과 (위반 없음)"
  exit 0
else
  echo "❌ FSD 위반 ${VIOLATIONS}건 발견 — 위의 파일들을 수정하세요"
  exit 1
fi
