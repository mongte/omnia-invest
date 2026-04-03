# Task Manager 칸반 워크플로우 패턴

## 상태 전이 다이어그램

```
TODO
 │
 │  BE/FE 에이전트 픽업 (assigneeId 설정)
 ▼
IN_PROGRESS
 │
 │  BE/FE 에이전트 구현 완료
 ▼
IN_REVIEW ─── QA 테스트 실패 ──► IN_PROGRESS (반려, 댓글 필수)
 │
 │  QA 테스트 통과
 ▼
DONE
```

**불변 원칙**:
- `TODO` → `IN_PROGRESS`: BE 또는 FE 에이전트만 가능
- `IN_PROGRESS` → `IN_REVIEW`: 해당 태스크 담당 개발 에이전트만 가능
- `IN_REVIEW` → `DONE`: QA 에이전트만 가능
- `IN_REVIEW` → `IN_PROGRESS`: QA 에이전트만 가능 (반드시 반려 댓글 먼저 추가)
- 어떤 에이전트도 자신의 태스크를 `DONE`으로 직접 변경할 수 없음

---

## PM 에이전트 워크플로우

```
1. [확인] GET /api/projects → 유효한 projectId 확인
2. [확인] GET /api/tasks → 기존 태스크 중복 확인
3. [분석] 요구사항을 BE/FE 단위로 분해
4. [생성] 각 태스크 POST /api/tasks (status: "TODO")
         - 제목: [BE] 또는 [FE] 태그 필수
         - 설명: 목표/요구사항/FSD 위치/수락 기준 포함
5. [보고] 생성된 태스크 목록을 사용자에게 보고 후 종료
```

**태스크 설명 필수 구성 요소**:
```
**목표**: 이 태스크가 달성하는 것
**요구사항**:
1. 구체적 요구사항 1
2. 구체적 요구사항 2
**FSD 아키텍처 위치**: 구현 위치 경로
**수락 기준**: QA가 통과 여부를 판단하는 기준
```

---

## BE 에이전트 워크플로우

```
1. [확인] GET /api/tasks → 태스크 목록 전체 조회

2. [우선탐색] 나에게 할당된 IN_PROGRESS 태스크 확인
   - 있으면: comments 배열에서 QA 반려 사유 확인
   - QA 반려 이슈부터 수정 (최우선)

3. [차선탐색] 위 없으면, [BE] 태그 + status=TODO 태스크 탐색
   - 없으면: IDLE 상태로 종료

4. [시작] 에이전트 상태 WORKING으로 갱신
   POST /api/agents (status: "WORKING", currentTaskId: "<TASK_ID>")

5. [시작 댓글] 태스크에 작업 시작 댓글 추가
   "[작업 시작] ..."

6. [픽업] 태스크 status → IN_PROGRESS, assigneeId 설정
   POST /api/tasks (id, status: "IN_PROGRESS", assigneeId: "agent-be-1")

7. [구현] 태스크 description의 요구사항에 따라 백엔드 코드 구현

8. [품질 검증]
   □ TypeScript strict 모드 오류 없음
   □ 에러 핸들링 적절히 처리됨
   □ API 응답 형식 일관성 확인
   □ 자체 테스트 통과

9. [완료 댓글] 구현 완료 내용 요약 댓글 추가
   "[작업 완료] ..."

10. [리뷰 요청] 태스크 status → IN_REVIEW
    POST /api/tasks (id, status: "IN_REVIEW")

11. [에이전트 갱신] 상태 IDLE로 복원
    POST /api/agents (status: "IDLE")
```

---

## FE 에이전트 워크플로우

```
1. [확인] GET /api/tasks → 태스크 목록 전체 조회

2. [우선탐색] 나에게 할당된 IN_PROGRESS 태스크 확인
   - 있으면: comments 배열에서 QA 반려 사유 확인
   - QA 반려 이슈부터 수정 (최우선)

3. [차선탐색] 위 없으면, [FE] 태그 + status=TODO 태스크 탐색
   - 없으면: IDLE 상태로 종료

4. [시작] 에이전트 상태 WORKING으로 갱신
   POST /api/agents (status: "WORKING", currentTaskId: "<TASK_ID>")

5. [시작 댓글] 태스크에 작업 시작 댓글 추가

6. [픽업] 태스크 status → IN_PROGRESS, assigneeId 설정
   POST /api/tasks (id, status: "IN_PROGRESS", assigneeId: "agent-fe-1")

7. [구현] FSD 레이어 규칙 준수하여 UI 컴포넌트 구현
   - widgets → features → entities → shared 방향만 import 허용
   - shadcn/ui 컴포넌트 우선 사용
   - Tailwind CSS only (CSS 모듈 금지)
   - TypeScript strict mode

8. [품질 검증]
   □ TypeScript strict 오류 없음
   □ FSD 레이어 의존성 방향 준수
   □ 반응형 레이아웃 확인
   □ 접근성 기본 검증 (aria, semantic HTML)
   □ shadcn/ui + Tailwind만 사용

9. [완료 댓글] 구현 완료 내용 요약 댓글 추가

10. [리뷰 요청] 태스크 status → IN_REVIEW

11. [에이전트 갱신] 상태 IDLE로 복원
```

---

## QA 에이전트 워크플로우

```
1. [확인] GET /api/tasks → IN_REVIEW 태스크 목록 조회

2. [선택] IN_REVIEW 태스크 없으면: IDLE 상태로 종료
         있으면: 대상 태스크 선택 (가장 오래된 것 우선)

3. [에이전트 갱신] 상태 WORKING으로 갱신
   POST /api/agents (status: "WORKING", currentTaskId: "<TASK_ID>")

4. [검증 준비] 태스크의 description에서 수락 기준 확인

5. [테스트 작성] Playwright E2E 테스트 코드 작성
   - 파일 경로: apps/<APP_NAME>/e2e/<PROJECT_ID>/<TASK_ID>.spec.ts
   - PM의 수락 기준을 기반으로 테스트 케이스 작성

6. [테스트 실행] Playwright MCP 또는 npx playwright test로 실행

7A. [통과 시]
   - 통과 댓글 추가: "[QA 통과] ..."
   - 태스크 status → DONE
   - 에이전트 상태 → IDLE

7B. [실패 시]
   - 반려 댓글 추가 (구조화된 버그 리포트 형식 필수)
   - 태스크 status → IN_PROGRESS (담당 개발자에게 반환)
   - 에이전트 상태 → IDLE
```

**QA 반려 댓글 필수 형식**:
```
[QA 반려]

**버그 제목**: <한 줄 요약>
**심각도**: HIGH | MEDIUM | LOW
**재현 단계**:
1. <단계 1>
2. <단계 2>
**기대 결과**: <PM 스펙 기준 기대 동작>
**실제 결과**: <실제로 일어난 동작>
**에러 로그**:
```
<에러 메시지 또는 테스트 출력>
```
**테스트 파일**: apps/<APP>/e2e/<PROJECT_ID>/<TASK_ID>.spec.ts
```

---

## 댓글 기반 히스토리 프로토콜

모든 에이전트는 다음 시점에 반드시 댓글을 남깁니다:

| 시점 | 에이전트 | 댓글 접두사 |
|------|----------|------------|
| 작업 시작 | BE/FE | `[작업 시작]` |
| 작업 완료 | BE/FE | `[작업 완료]` |
| QA 통과 | QA | `[QA 통과]` |
| QA 반려 | QA | `[QA 반려]` |
| 이슈 발견 | 모든 에이전트 | `[이슈]` |

**히스토리 누적 원칙**: 댓글은 절대 삭제하지 않습니다. 모든 작업 이력이 댓글 타임라인에 누적되어 작업 흐름을 추적할 수 있어야 합니다.
