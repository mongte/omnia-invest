#!/bin/bash
# TaskCompleted: 태스크 완료 시 Slack 알림

INPUT=$(cat)

# .env에서 Slack webhook URL 로드
ENV_FILE="$(echo "$INPUT" | jq -r '.cwd // "."')/.env"
if [ -f "$ENV_FILE" ]; then
  SLACK_WEBHOOK_URL=$(grep '^SLACK_WEBHOOK_URL=' "$ENV_FILE" | cut -d'=' -f2-)
fi

if [ -z "$SLACK_WEBHOOK_URL" ]; then
  exit 0
fi

TASK_ID=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n \
    --arg task "$TASK_ID" \
    --arg session "$SESSION_ID" \
    '{text: "✅ 태스크 완료 — session: \($session)"}'
  )" > /dev/null 2>&1

exit 0
