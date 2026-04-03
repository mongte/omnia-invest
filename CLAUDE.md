# CLAUDE.md

Nx monorepo. 앱별 상세 가이드는 각 앱의 CLAUDE.md 참조.

## Apps

- **task-manager** — `apps/task-manager/CLAUDE.md`
- **pharos-lab** — `apps/pharos-lab/CLAUDE.md`

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