#!/bin/bash
# Stop 훅: /work 파이프라인이 진행 중이면 Claude 종료를 차단
# 상태 파일: /tmp/harness-pipeline-*.json
# exit 0 = 종료 허용, exit 2 = 종료 차단 + 다음 단계 안내

# /tmp에서 파이프라인 상태 파일 찾기
STATE_FILE=$(ls /tmp/harness-pipeline-*.json 2>/dev/null | head -1)

# 상태 파일 없음 → 파이프라인 미실행, 정상 종료 허용
if [ -z "$STATE_FILE" ] || [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

CURRENT=$(jq -r '.current // "done"' "$STATE_FILE" 2>/dev/null)
TASK=$(jq -r '.task // ""' "$STATE_FILE" 2>/dev/null)

# 파이프라인 완료 또는 상태 읽기 실패 → 종료 허용
if [ "$CURRENT" = "done" ] || [ -z "$CURRENT" ]; then
  rm -f "$STATE_FILE"
  exit 0
fi

# 다음 단계 안내 메시지 구성
case "$CURRENT" in
  implement)
    NEXT_MSG="구현을 완료하세요. 완료 후 scripts/check-fsd-deps.sh와 npx tsc --noEmit을 실행하세요."
    ;;
  verify)
    NEXT_MSG="아키텍처 검증을 완료하세요: bash scripts/check-fsd-deps.sh && cd apps/pharos-lab && npx tsc --noEmit"
    ;;
  qa)
    NEXT_MSG="gstack QA를 실행하세요: /qa-only 스킬 실행 또는 dev 서버 미실행 시 이 단계를 스킵하고 review로 이동."
    ;;
  review)
    NEXT_MSG="/review 스킬을 실행하여 코드 리뷰를 완료하세요."
    ;;
  fix)
    NEXT_MSG="발견된 이슈를 수정하고 검증을 재실행하세요. 이슈가 없으면 /ship을 실행하세요."
    ;;
  ship)
    NEXT_MSG="/ship 스킬을 실행하여 PR을 생성하거나 배포를 완료하세요."
    ;;
  *)
    rm -f "$STATE_FILE"
    exit 0
    ;;
esac

# 종료 차단 + 다음 단계 안내
echo "🔄 파이프라인 진행 중: '${TASK}'" >&2
echo "현재 단계: ${CURRENT}" >&2
echo "다음 작업: ${NEXT_MSG}" >&2
exit 2
