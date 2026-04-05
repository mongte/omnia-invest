#!/usr/bin/env bash
# =============================================================================
# Task Manager API CLI
# 에이전트가 한 줄로 Task Manager API를 호출할 수 있는 재사용 스크립트
#
# Usage: bash task-api.sh <command> [args...]
# =============================================================================

set -euo pipefail

BASE_URL="http://localhost:4200"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

now() {
  date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

# jq가 있으면 포맷팅, 없으면 raw 출력
format_json() {
  if command -v jq &>/dev/null; then
    jq .
  else
    cat
  fi
}

# JSON-safe POST 요청 (HTTP 에러 및 연결 실패 감지)
post_json() {
  local url="$1"
  local data="$2"
  local raw
  local http_code

  if ! raw=$(curl -s -w "\n%{http_code}" -X POST "$url" \
    -H "Content-Type: application/json" -d "$data" --max-time 10); then
    echo "ERROR: 서버 연결 실패 ($url)" >&2
    return 1
  fi

  http_code=$(echo "$raw" | tail -1)
  raw=$(echo "$raw" | sed '$d')

  if [[ -z "$http_code" || "$http_code" == "000" || "$http_code" -ge 400 ]]; then
    echo "ERROR: HTTP ${http_code:-000} from $url" >&2
    echo "$raw" | format_json >&2
    return 1
  fi

  echo "$raw" | format_json
}

usage() {
  cat <<'EOF'
Task Manager API CLI

Usage: bash task-api.sh <command> [args...]

--- Tasks ---
  list-tasks       <projectId>                                    태스크 전체 조회
  get-task         <projectId> <taskId>                           단일 태스크 조회
  update-status    <projectId> <taskId> <status> [assigneeId]     태스크 상태 변경
  create-task      <projectId> <taskId> <title> <desc> [status]   태스크 생성 (PM)
  add-comment      <projectId> <taskId> <agentId> <content>       댓글 추가
  clear-completed  <projectId>                                    DONE 태스크 삭제

--- Agents ---
  list-agents      <projectId>                                    에이전트 목록
  register-agent   <projectId> <agentId> <name> <role> [status]   에이전트 등록
  update-agent     <projectId> <agentId> <status> [taskId]        에이전트 상태 변경

--- Projects ---
  list-projects                                                   프로젝트 목록
  create-project   <title> [color] [icon]                         프로젝트 생성
  delete-project   <projectId>                                    프로젝트 삭제

Status values:  TODO | IN_PROGRESS | IN_REVIEW | DONE
Agent status:   IDLE | WORKING | OFFLINE | ERROR
EOF
  exit 1
}

# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

list_tasks() {
  local project_id="${1:?projectId 필요}"
  curl -s "${BASE_URL}/api/tasks?projectId=${project_id}" | format_json
}

get_task() {
  local project_id="${1:?projectId 필요}"
  local task_id="${2:?taskId 필요}"
  if command -v jq &>/dev/null; then
    curl -s "${BASE_URL}/api/tasks?projectId=${project_id}" \
      | jq --arg id "$task_id" '.[] | select(.id == $id)'
  else
    curl -s "${BASE_URL}/api/tasks?projectId=${project_id}"
  fi
}

update_status() {
  local project_id="${1:?projectId 필요}"
  local task_id="${2:?taskId 필요}"
  local status="${3:?status 필요 (TODO|IN_PROGRESS|IN_REVIEW|DONE)}"
  local assignee_id="${4:-}"
  local ts
  ts="$(now)"

  local data
  if command -v jq &>/dev/null; then
    if [[ -n "$assignee_id" ]]; then
      data=$(jq -n \
        --arg id "$task_id" \
        --arg status "$status" \
        --arg assigneeId "$assignee_id" \
        --arg updatedAt "$ts" \
        '{id: $id, status: $status, assigneeId: $assigneeId, updatedAt: $updatedAt}')
    else
      data=$(jq -n \
        --arg id "$task_id" \
        --arg status "$status" \
        --arg updatedAt "$ts" \
        '{id: $id, status: $status, updatedAt: $updatedAt}')
    fi
  else
    if [[ -n "$assignee_id" ]]; then
      data="{\"id\":\"${task_id}\",\"status\":\"${status}\",\"assigneeId\":\"${assignee_id}\",\"updatedAt\":\"${ts}\"}"
    else
      data="{\"id\":\"${task_id}\",\"status\":\"${status}\",\"updatedAt\":\"${ts}\"}"
    fi
  fi

  post_json "${BASE_URL}/api/tasks?projectId=${project_id}" "$data"
}

create_task() {
  local project_id="${1:?projectId 필요}"
  local task_id="${2:?taskId 필요}"
  local title="${3:?title 필요}"
  local description="${4:?description 필요}"
  local status="${5:-TODO}"
  local ts
  ts="$(now)"

  local data
  if command -v jq &>/dev/null; then
    data=$(jq -n \
      --arg id "$task_id" \
      --arg title "$title" \
      --arg description "$description" \
      --arg status "$status" \
      --arg createdAt "$ts" \
      --arg updatedAt "$ts" \
      '{id: $id, title: $title, description: $description, status: $status, createdAt: $createdAt, updatedAt: $updatedAt}')
  else
    data="{\"id\":\"${task_id}\",\"title\":\"${title}\",\"description\":\"${description}\",\"status\":\"${status}\",\"createdAt\":\"${ts}\",\"updatedAt\":\"${ts}\"}"
  fi

  post_json "${BASE_URL}/api/tasks?projectId=${project_id}" "$data"
}

add_comment() {
  local project_id="${1:?projectId 필요}"
  local task_id="${2:?taskId 필요}"
  local agent_id="${3:?agentId 필요}"
  local content="${4:?content 필요}"

  local data
  if command -v jq &>/dev/null; then
    data=$(jq -n \
      --arg taskId "$task_id" \
      --arg agentId "$agent_id" \
      --arg content "$content" \
      '{taskId: $taskId, agentId: $agentId, content: $content}')
  else
    data="{\"taskId\":\"${task_id}\",\"agentId\":\"${agent_id}\",\"content\":\"${content}\"}"
  fi

  post_json "${BASE_URL}/api/tasks/comments?projectId=${project_id}" "$data"
}

clear_completed() {
  local project_id="${1:?projectId 필요}"
  post_json "${BASE_URL}/api/tasks/clear-completed?projectId=${project_id}" "{}"
}

# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------

list_agents() {
  local project_id="${1:?projectId 필요}"
  curl -s "${BASE_URL}/api/agents?projectId=${project_id}" | format_json
}

register_agent() {
  local project_id="${1:?projectId 필요}"
  local agent_id="${2:?agentId 필요}"
  local name="${3:?name 필요}"
  local role="${4:?role 필요}"
  local status="${5:-IDLE}"
  local ts
  ts="$(now)"

  local data
  if command -v jq &>/dev/null; then
    data=$(jq -n \
      --arg id "$agent_id" \
      --arg name "$name" \
      --arg role "$role" \
      --arg status "$status" \
      --arg lastActiveAt "$ts" \
      '{id: $id, name: $name, role: $role, status: $status, lastActiveAt: $lastActiveAt}')
  else
    data="{\"id\":\"${agent_id}\",\"name\":\"${name}\",\"role\":\"${role}\",\"status\":\"${status}\",\"lastActiveAt\":\"${ts}\"}"
  fi

  post_json "${BASE_URL}/api/agents?projectId=${project_id}" "$data"
}

update_agent() {
  local project_id="${1:?projectId 필요}"
  local agent_id="${2:?agentId 필요}"
  local status="${3:?status 필요 (IDLE|WORKING|OFFLINE|ERROR)}"
  local current_task_id="${4:-}"
  local ts
  ts="$(now)"

  local data
  if command -v jq &>/dev/null; then
    if [[ -n "$current_task_id" ]]; then
      data=$(jq -n \
        --arg id "$agent_id" \
        --arg status "$status" \
        --arg currentTaskId "$current_task_id" \
        --arg lastActiveAt "$ts" \
        '{id: $id, status: $status, currentTaskId: $currentTaskId, lastActiveAt: $lastActiveAt}')
    else
      data=$(jq -n \
        --arg id "$agent_id" \
        --arg status "$status" \
        --arg lastActiveAt "$ts" \
        '{id: $id, status: $status, lastActiveAt: $lastActiveAt}')
    fi
  else
    if [[ -n "$current_task_id" ]]; then
      data="{\"id\":\"${agent_id}\",\"status\":\"${status}\",\"currentTaskId\":\"${current_task_id}\",\"lastActiveAt\":\"${ts}\"}"
    else
      data="{\"id\":\"${agent_id}\",\"status\":\"${status}\",\"lastActiveAt\":\"${ts}\"}"
    fi
  fi

  post_json "${BASE_URL}/api/agents?projectId=${project_id}" "$data"
}

# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

list_projects() {
  curl -s "${BASE_URL}/api/projects" | format_json
}

create_project() {
  local title="${1:?title 필요}"
  local color="${2:-#6366f1}"
  local icon="${3:-}"

  local data
  if command -v jq &>/dev/null; then
    if [[ -n "$icon" ]]; then
      data=$(jq -n \
        --arg title "$title" \
        --arg color "$color" \
        --arg icon "$icon" \
        '{title: $title, color: $color, icon: $icon}')
    else
      data=$(jq -n \
        --arg title "$title" \
        --arg color "$color" \
        '{title: $title, color: $color}')
    fi
  else
    if [[ -n "$icon" ]]; then
      data="{\"title\":\"${title}\",\"color\":\"${color}\",\"icon\":\"${icon}\"}"
    else
      data="{\"title\":\"${title}\",\"color\":\"${color}\"}"
    fi
  fi

  post_json "${BASE_URL}/api/projects" "$data"
}

delete_project() {
  local project_id="${1:?projectId 필요}"
  curl -s -X DELETE "${BASE_URL}/api/projects/${project_id}" | format_json
}

# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

cmd="${1:-}"
[[ -z "$cmd" ]] && usage

shift
case "$cmd" in
  list-tasks)       list_tasks "$@" ;;
  get-task)         get_task "$@" ;;
  update-status)    update_status "$@" ;;
  create-task)      create_task "$@" ;;
  add-comment)      add_comment "$@" ;;
  clear-completed)  clear_completed "$@" ;;
  list-agents)      list_agents "$@" ;;
  register-agent)   register_agent "$@" ;;
  update-agent)     update_agent "$@" ;;
  list-projects)    list_projects "$@" ;;
  create-project)   create_project "$@" ;;
  delete-project)   delete_project "$@" ;;
  help|-h|--help)   usage ;;
  *)
    echo "Error: 알 수 없는 명령어 '$cmd'"
    echo ""
    usage
    ;;
esac
