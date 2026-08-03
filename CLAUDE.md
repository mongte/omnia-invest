# CLAUDE.md

Nx monorepo. 앱별 상세 가이드는 각 앱의 CLAUDE.md 참조.

## Apps

- **task-manager** — `apps/task-manager/CLAUDE.md`
- **pharos-lab** — `apps/pharos-lab/CLAUDE.md`

## Knowledge Base

- 전체 목차: `doc/index.md`
- 아키텍처: `doc/architecture/`
- 실행 계획: `doc/plans/active/`
- 품질 점수: `doc/quality/QUALITY_SCORE.md`
- 기술 부채: `doc/plans/tech-debt-tracker.md`
- 파이프라인 로그: `doc/quality/pipeline-log.jsonl`
- 주간 트렌드: `doc/quality/weekly-trend.md`

## 지식 위키 (LLM Wiki + Graphify) — pharos-lab

- KB 단일 출처: `omnia-invest-doc/pharos-lab/` (`raw/` 원본, `wiki/` 가공 노트)
- Graphify 결과: 모노레포 루트 `graphify-out/` (`GRAPH_REPORT.md`, `graph.json`)
- 빌드: 모노레포 루트에서 `./omnia-invest-doc/pharos-lab` 대상 (`/graphify ./omnia-invest-doc/pharos-lab --obsidian` 등)

### 질문에 답하기 전 (토큰 절약)
1. `graphify-out/GRAPH_REPORT.md`를 먼저 읽는다.
2. 더 깊은 탐색은 `graphify query "<질문>"` 또는 `graphify-out/graph.json`.
3. 원본(`omnia-invest-doc/pharos-lab/raw/`) 전체를 매번 grep/read 하지 않는다.
4. 그래프가 없으면 `omnia-invest-doc/pharos-lab/wiki/인덱스 (MOC).md`에서 시작해 관련 노트만 읽는다.

## Harness Pipeline

- `/work [작업 내용]` — 구현→검증→QA→리뷰→수정→Ship 풀 파이프라인
- `/agent gc` — 품질 점수 갱신 + 패턴 감지 + 규칙 자동 생성
- `/retro` — 주간 레트로 + 트렌드 분석

## Common Rules
- **파일을 읽기 전에 항상 `qmd`로 먼저 검색할 것**
- Prettier (`singleQuote: true`), EditorConfig (2 spaces, UTF-8, LF)
- TypeScript strict mode. `any` 금지
- 상세: `.claude/rules/`
- 이미 읽은 파일은 다시 확인 하지 않기
- 불필요한 도구 호출 차단하기
- *가능한* 호출은 동시에 실행하기
- 20줄 이상 출력은 서브에이전트로
- 사용자가 이미 설명한 내용을 다시 말하지 않기

## gstack

- Use the `/browse` skill from gstack for all web browsing
- Never use `mcp__claude-in-chrome__*` tools
- Available gstack skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health