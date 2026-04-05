# Task Manager

AI Agent 협업을 위한 칸반 기반 태스크 관리 대시보드.

PM/BE/FE/QA 에이전트가 칸반 보드에서 태스크를 픽업하고, 구현하고, 리뷰하는 워크플로우를 지원합니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript strict (`any` 금지) |
| 스타일 | Tailwind CSS + shadcn/ui (Radix) |
| 상태관리 | Zustand |
| 드래그앤드롭 | @hello-pangea/dnd |
| 애니메이션 | @formkit/auto-animate |
| 테스트 | Playwright (E2E) |
| 데이터 | JSON 파일 DB + REST API + SSE |

## 시작하기

```bash
# 개발 서버 (localhost:4200)
npm run dev:task-manager

# 프로덕션 빌드
npm run build:task-manager

# 타입 체크
npx tsc --noEmit
```

## 프로젝트 구조

```
apps/task-manager/
├── data/                          # JSON 파일 DB
│   ├── projects.json              # 프로젝트 목록
│   └── projects/{id}.json         # 프로젝트별 태스크 데이터
├── e2e/                           # Playwright E2E 테스트
└── src/
    ├── app/                       # Next.js App Router
    │   ├── api/                   # REST API Routes
    │   │   ├── agents/            # 에이전트 상태 관리
    │   │   ├── mcp/               # MCP 프로토콜 연동
    │   │   ├── projects/          # 프로젝트 CRUD
    │   │   ├── tasks/             # 태스크 CRUD + 댓글
    │   │   └── stream/            # SSE 실시간 업데이트
    │   └── projects/[projectId]/  # 프로젝트 상세 페이지
    ├── views/                     # 페이지 수준 컴포넌트
    │   ├── _home/                 # 홈 (프로젝트 목록)
    │   └── task-details/          # 태스크 상세
    ├── widgets/                   # 복합 UI 컴포넌트
    │   ├── board/                 # 칸반 보드 (드래그앤드롭)
    │   ├── sidebar/               # 네비게이션 사이드바
    │   ├── task-list/             # 태스크 리스트 뷰
    │   ├── task-artifacts/        # 태스크 산출물
    │   ├── task-metadata-header/  # 태스크 헤더
    │   └── task-work-log/         # 작업 이력
    ├── features/                  # 비즈니스 로직
    │   ├── task-management/       # 태스크 상태 전환, CRUD
    │   ├── project-management/    # 프로젝트 생성, 라우팅
    │   └── qa-controls/           # QA 전용 컨트롤
    ├── entities/                  # 데이터 모델 + Zustand 스토어
    │   ├── task/                  # 태스크 타입 + 스토어
    │   ├── agent/                 # 에이전트 타입 + 스토어
    │   └── project/               # 프로젝트 스토어
    └── shared/                    # 공통 모듈
        ├── ui/                    # shadcn/ui 컴포넌트
        ├── api/local-db/          # JSON 파일 DB 유틸
        ├── api/mcp/               # MCP 클라이언트
        └── lib/                   # 유틸리티 (date, utils)
```

## FSD 아키텍처

Feature-Sliced Design 레이어 구조를 따릅니다.

```
app → views → widgets → features → entities → shared
```

상위 레이어만 하위 레이어를 import 할 수 있습니다. **역방향 import 금지.**

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET/POST | `/api/projects` | 프로젝트 목록 / 생성 |
| GET/PUT/DELETE | `/api/projects/[id]` | 프로젝트 상세 / 수정 / 삭제 |
| GET/POST/PUT/DELETE | `/api/tasks` | 태스크 CRUD |
| DELETE | `/api/tasks/clear-completed` | 완료 태스크 일괄 삭제 |
| GET/POST | `/api/tasks/comments` | 태스크 댓글 |
| GET/POST | `/api/agents` | 에이전트 상태 조회 / 업데이트 |
| GET | `/api/stream` | SSE 실시간 이벤트 |

## 칸반 워크플로우

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
        (BE/FE)        (QA)
```

1. **PM 에이전트**: 요구사항 분석 → `[BE]`/`[FE]` 태스크 생성 (TODO)
2. **BE/FE 에이전트**: 태스크 픽업 → 구현 → IN_REVIEW 전환
3. **QA 에이전트**: E2E 테스트 → 통과 시 DONE / 반려 시 IN_PROGRESS 복귀

## 데이터 저장

JSON 파일 기반 영속성:

- `data/projects.json` — 프로젝트 인덱스
- `data/projects/{projectId}.json` — 프로젝트별 전체 데이터 (태스크, 댓글, 에이전트 상태)

SSE(`/api/stream`)를 통해 파일 변경 시 클라이언트에 실시간 반영.
