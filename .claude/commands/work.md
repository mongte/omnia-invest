작업 요청을 받아 구현 → 검증 → QA → 리뷰 → 수정 → Ship까지 자동으로 처리합니다.

작업 내용: $ARGUMENTS

---

## 파이프라인 시작

아래 6단계를 순서대로 실행하세요. 각 단계를 건너뛰지 마세요.

### 1단계: 파이프라인 상태 초기화

```bash
SESSION_ID=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 8)
STATE_FILE="/tmp/harness-pipeline-${SESSION_ID}.json"
echo "{\"session\":\"${SESSION_ID}\",\"task\":\"$ARGUMENTS\",\"current\":\"implement\",\"completed\":[],\"errors\":[]}" > "$STATE_FILE"
echo "파이프라인 시작: $STATE_FILE"
```

### 2단계: 구현

작업 내용(`$ARGUMENTS`)을 분석하여 적절한 에이전트로 구현합니다:
- FE 작업 (컴포넌트, 페이지, UI) → frontend 에이전트
- BE 작업 (API, DB, 서비스) → backend 에이전트
- 복합 작업 → 두 에이전트 순서대로

구현 완료 후 상태 업데이트:
```bash
jq '.current = "verify" | .completed += ["implement"]' "$STATE_FILE" > /tmp/state_tmp.json && mv /tmp/state_tmp.json "$STATE_FILE"
```

### 3단계: 아키텍처 + 타입 검증

```bash
# FSD 레이어 검사
bash scripts/check-fsd-deps.sh

# TypeScript 타입 체크
cd apps/pharos-lab && npx tsc --noEmit 2>&1 | head -30

# 파일 크기 검사
bash scripts/check-file-size.sh
```

**검증 실패 시**: 에러 메시지를 읽고 즉시 수정 후 재검증 (최대 3회 시도).
모든 검증 통과 후 상태 업데이트:
```bash
jq '.current = "qa" | .completed += ["verify"]' "$STATE_FILE" > /tmp/state_tmp.json && mv /tmp/state_tmp.json "$STATE_FILE"
```

### 4단계: gstack QA

dev 서버가 실행 중인지 확인:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

서버가 실행 중이면 `/qa-only` 스킬을 실행합니다.
서버가 없으면 이 단계를 기록하고 5단계로 넘어갑니다.

QA 완료 후 상태 업데이트:
```bash
jq '.current = "review" | .completed += ["qa"]' "$STATE_FILE" > /tmp/state_tmp.json && mv /tmp/state_tmp.json "$STATE_FILE"
```

### 5단계: 코드 리뷰

`/review` 스킬을 실행합니다. diff 기반 코드 리뷰.

리뷰 완료 후 상태 업데이트:
```bash
jq '.current = "fix" | .completed += ["review"]' "$STATE_FILE" > /tmp/state_tmp.json && mv /tmp/state_tmp.json "$STATE_FILE"
```

### 6단계: 이슈 수정 루프

3~4단계에서 발견된 이슈가 있으면:
1. 이슈 목록 정리
2. 심각도 순으로 수정 (최대 2회 루프)
3. 수정 후 3단계 검증 재실행

이슈 없으면 바로 다음 단계로.

상태 업데이트:
```bash
jq '.current = "ship" | .completed += ["fix"]' "$STATE_FILE" > /tmp/state_tmp.json && mv /tmp/state_tmp.json "$STATE_FILE"
```

### 7단계: Ship

`/ship` 스킬을 실행합니다 — PR 생성 또는 배포.

완료 후 파이프라인 종료:
```bash
jq '.current = "done" | .completed += ["ship"]' "$STATE_FILE" > /tmp/state_tmp.json && mv /tmp/state_tmp.json "$STATE_FILE"
rm "$STATE_FILE"
```

### 8단계: 학습 기록

파이프라인 전체에서 발견된 이슈를 `doc/quality/pipeline-log.jsonl`에 기록합니다.
이 로그는 gc 에이전트가 패턴 감지 + 규칙 자동 생성에 사용합니다.

```bash
LOG_FILE="doc/quality/pipeline-log.jsonl"
```

아래 JSON 형식으로 한 줄 추가:
```json
{"date":"YYYY-MM-DD","task":"작업 내용","issues":["이슈1","이슈2"],"fixed":true,"qa_pass":true,"review_pass":true,"new_files":3,"modified_files":2}
```

각 필드 설명:
- `issues`: 검증/QA/리뷰에서 발견된 모든 이슈 목록 (빈 배열도 OK)
- `fixed`: 발견된 이슈가 모두 자동 수정되었는지
- `qa_pass`: gstack QA 통과 여부
- `review_pass`: 코드 리뷰 통과 여부

---

## 최종 리포트

모든 단계 완료 후 아래 형식으로 요약:

```
✅ 파이프라인 완료: [작업 내용]

단계별 결과:
1. 구현  ✅ — [수정된 파일 수]개 파일
2. 검증  ✅ — FSD 위반 0건, 타입 에러 0건
3. QA    ✅ — [gstack 결과 요약]
4. 리뷰  ✅ — [주요 피드백]
5. 수정  ✅ — [수정된 이슈 수]건
6. Ship  ✅ — [PR URL 또는 배포 URL]
7. 학습  ✅ — pipeline-log.jsonl에 기록 완료
```
