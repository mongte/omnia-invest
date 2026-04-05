#!/bin/bash
# SubagentStart / SubagentStop Slack 알림 스크립트
# stdin으로 hook JSON input을 받음

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../../.env"
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name')
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // ""')
CWD=$(echo "$INPUT" | jq -r '.cwd // ""')
PROJECT=$(basename "$CWD")

WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
if [ -z "$WEBHOOK_URL" ]; then
  exit 0
fi

if [ "$EVENT" = "SubagentStart" ]; then
  PAYLOAD=$(jq -n \
    --arg text "🚀 *[${PROJECT}] ${AGENT_TYPE} 에이전트 작업 시작*
Agent ID: \`${AGENT_ID}\`" \
    '{text: $text}')

elif [ "$EVENT" = "SubagentStop" ]; then
  LAST_MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // "결과 없음"' | head -c 400)
  PAYLOAD=$(jq -n \
    --arg text "✅ *[${PROJECT}] ${AGENT_TYPE} 에이전트 작업 완료*
Agent ID: \`${AGENT_ID}\`
📋 결과: ${LAST_MSG}" \
    '{text: $text}')
else
  exit 0
fi

curl -s -X POST \
  -H 'Content-type: application/json' \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL" > /dev/null 2>&1

exit 0
