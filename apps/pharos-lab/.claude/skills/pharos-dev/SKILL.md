---
name: pharos-dev
description: pharos-lab 기능 개발 전체 파이프라인 오케스트레이터. 새 기능 요청, Mock→실DB 마이그레이션, 버그 수정, 재실행, 업데이트, 보완 등 pharos-lab 개발 작업 전반을 PM→BE+FE→QA 순서로 에이전트 팀을 조율하여 처리합니다. pharos-lab 관련 구현 작업 시 반드시 이 스킬 사용할 것.
---

# Pharos Dev 오케스트레이터

**실행 모드**: 하이브리드
- Phase 1 (PM): 서브 에이전트
- Phase 2 (BE + FE): 에이전트 팀 (병렬)
- Phase 3 (QA): 서브 에이전트

## Phase 0: 컨텍스트 확인

워크플로우 시작 전 기존 산출물 존재 여부 확인:

1. `_workspace/` 존재 + 부분 수정 요청 → **부분 재실행** (해당 에이전트만 재호출)
2. `_workspace/` 존재 + 새 요구사항 → **새 실행** (`_workspace/`를 `_workspace_prev/`로 이동)
3. `_workspace/` 미존재 → **초기 실행**

PROJECT_ID 확인 (task-manager 칸반 보드 URL 또는 ID):
- 없으면 사용자에게 요청

## Phase 1: PM — 요구사항 분해 [서브 에이전트]

```python
Agent(
    subagent_type="pharos-pm",
    model="opus",
    prompt=f"""
PROJECT_ID: {project_id}

요구사항: {user_request}

pharos-fsd, pharos-domain 스킬을 로드하여 FSD 아키텍처 기반으로
[BE]/[FE] 태스크를 칸반 보드에 생성하고 목록을 반환하라.
"""
)
```

PM 결과물: 생성된 태스크 ID 목록  
PM 완료 확인 후 Phase 2 진행.

## Phase 2: BE + FE 병렬 구현 [에이전트 팀]

BE 태스크와 FE 태스크를 병렬로 처리한다.  
단, FE가 BE 타입에 의존하는 경우 BE 완료를 기다린 뒤 FE 시작.

```python
# BE 에이전트 (background)
Agent(
    subagent_type="pharos-be",
    model="opus",
    run_in_background=True,
    prompt=f"""
PROJECT_ID: {project_id}
칸반 보드의 [BE] TODO 태스크를 픽업하여 구현하라.
pharos-fsd, pharos-domain, supabase-postgres-best-practices 스킬 활용.
완료 후 IN_REVIEW로 업데이트.
"""
)

# FE 에이전트 (background, BE 독립 태스크 병렬 처리)
Agent(
    subagent_type="pharos-fe",
    model="opus",
    run_in_background=True,
    prompt=f"""
PROJECT_ID: {project_id}
칸반 보드의 [FE] TODO 태스크를 픽업하여 구현하라.
pharos-fsd, pharos-domain, shadcn, react-ui-patterns 스킬 활용.
완료 후 IN_REVIEW로 업데이트.
BE 타입 변경 공지 수신 시 즉시 반영.
"""
)
```

## Phase 3: QA 검증 [서브 에이전트]

BE + FE 모두 IN_REVIEW 상태가 되면 QA 실행:

```python
Agent(
    subagent_type="pharos-qa",
    model="opus",
    prompt=f"""
PROJECT_ID: {project_id}
IN_REVIEW 태스크를 검증하라:
1. FSD 레이어 위반 검사 (pharos-fsd 스킬)
2. 투자 도메인 규칙 준수 (pharos-domain 스킬)
3. TypeScript 빌드 에러 확인
4. E2E 핵심 경로 검증

통과: DONE, 실패: IN_PROGRESS 반려 + 버그 리포트
"""
)
```

## 데이터 전달 프로토콜

- **태스크 기반**: 칸반 보드(task-manager-api)로 작업 상태 공유
- **파일 기반**: 중간 산출물은 `apps/pharos-lab/_workspace/` 에 저장
  - 파일명: `{phase}_{agent}_{artifact}.{ext}` (예: `01_pm_tasks.md`, `02_be_api.ts`)
- **메시지 기반**: BE 타입 변경 시 FE에게 SendMessage로 즉시 통보

## 에러 핸들링

| 상황 | 처리 |
|------|------|
| PM 태스크 생성 실패 | 요구사항 재확인 후 1회 재시도 |
| BE 구현 실패 | 실패 태스크 description에 에러 기록, FE는 독립 태스크 계속 진행 |
| FE 구현 실패 | BE 타입 의존성 확인 후 재시도 |
| QA 반려 | 담당 에이전트(BE/FE) 재호출, 최대 2회 |
| 2회 연속 반려 | 사용자에게 에스컬레이션 |

## 부분 재실행 패턴

```
사용자: "BE 부분만 다시 구현해줘"
→ Phase 2에서 pharos-be만 재호출
→ 완료 후 Phase 3 (QA)만 재실행

사용자: "QA만 다시 돌려줘"
→ Phase 3만 실행
```

## 테스트 시나리오

### 정상 흐름
1. 사용자: "Dashboard에 주가 변동률 컬럼 추가해줘 (PROJECT_ID: proj-xxx)"
2. Phase 0: 기존 _workspace 없음 → 초기 실행
3. Phase 1: PM이 [BE] Supabase 쿼리 수정, [FE] 컬럼 UI 추가 태스크 생성
4. Phase 2: BE가 `shared/api/dashboard.ts` 수정, FE가 `widgets/dashboard/` 컴포넌트 수정 (병렬)
5. Phase 3: QA가 FSD 위반 없음, 타입 일치, 투자 표현 없음 확인 → DONE

### 에러 흐름
1. 사용자: "Mock 데이터를 실 DB로 교체해줘"
2. Phase 1: PM이 mock 참조 파일별로 BE 태스크 생성
3. Phase 2: BE가 API 함수 구현, FE가 view wiring 수정
4. Phase 3: QA가 TypeScript 빌드 에러 발견 → BE에게 반려
5. BE 수정 후 Phase 3 재실행 → DONE
