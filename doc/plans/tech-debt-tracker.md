# Tech Debt Tracker

> 이 파일은 `gc` 에이전트와 개발자가 함께 관리합니다.
> 자동 수정이 불확실하거나 위험한 이슈는 여기에 기록 후 수동 처리합니다.

## Active (처리 필요)

| ID | 유형 | 파일 | 설명 | 우선순위 | 발견일 |
|----|------|------|------|----------|--------|
| TD-001 | FILE_TOO_LARGE | `apps/pharos-lab/src/shared/types/supabase.ts` | 510줄 (상한 500줄 초과) — Supabase 자동 생성 타입. 도메인별 분리 검토 | LOW | 2026-04-14 |
| TD-002 | FILE_TOO_LARGE | `apps/pharos-lab/src/shared/lib/mock-data.ts` | 540줄 — mock 데이터를 도메인별 파일로 분리 | LOW | 2026-04-14 |
| TD-003 | FILE_TOO_LARGE | `apps/pharos-lab/src/views/dashboard/dashboard-view.tsx` | 429줄 (경고) — 섹션별 서브컴포넌트 추출 검토 | LOW | 2026-04-14 |
| TD-004 | FILE_TOO_LARGE | `apps/pharos-lab/src/widgets/dashboard/ranking-list.tsx` | 413줄 (경고) | LOW | 2026-04-14 |

## Completed (완료)

| ID | 유형 | 설명 | 완료일 |
|----|------|------|--------|
| - | - | - | - |

## 유형 분류

- `TYPE_ERROR` — TypeScript 컴파일 에러
- `FSD_VIOLATION` — FSD 레이어 의존성 위반
- `FILE_TOO_LARGE` — 500줄 초과 파일
- `DEAD_CODE` — 미사용 코드/import
- `TS_IGNORE` — @ts-ignore 사용
- `PATTERN_DRIFT` — 코드베이스 패턴 불일치
