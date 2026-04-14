# Knowledge Base

> 에이전트를 위한 지식 지도입니다. 각 항목은 더 깊은 정보로의 포인터입니다.
> 여기서 모든 것을 설명하지 않습니다. 링크를 따라가세요.

## 아키텍처

| 문서 | 내용 |
|------|------|
| [FSD 레이어 구조](architecture/fsd-layers.md) | 레이어 의존성 규칙, 폴더 구조 |
| [데이터 파이프라인](architecture/data-pipeline.md) | KOSPI Top200 ETL, 스케줄, 스크립트 |
| [스코어링 시스템](architecture/scoring-system.md) | 3-Layer 종목 분석 구조 |

## 앱별 가이드

| 앱 | 가이드 |
|----|--------|
| pharos-lab | `apps/pharos-lab/CLAUDE.md` |
| task-manager | `apps/task-manager/CLAUDE.md` |

## 운영

| 문서 | 내용 |
|------|------|
| [품질 점수](quality/QUALITY_SCORE.md) | 자동 갱신 품질 메트릭 |
| [파이프라인 로그](quality/pipeline-log.jsonl) | /work 실행 결과 누적 기록 |
| [주간 트렌드](quality/weekly-trend.md) | 품질 추이 비교 (주 단위) |
| [기술 부채](plans/tech-debt-tracker.md) | 미해결 이슈 추적 |
| [활성 계획](plans/active/) | 현재 실행 중인 작업 계획 |

## 에이전트 팀

| 에이전트 | 역할 |
|----------|------|
| frontend | FE 구현 — FSD 아키텍처 준수 |
| backend | BE 구현 — API, DB |
| pm | 요구사항 분석, 태스크 생성 |
| qa | E2E 테스트 + gstack 시각 검증 |
| database | Supabase DB 관리 |
| quant | 종목 분석 실행 |
| strategy | 전략 리서치 |
| gc | 가비지 컬렉션, 품질 점수 갱신 |

## 규칙

`.claude/rules/`에 위치:
- `fsd-layer-deps.md` — FSD 레이어 의존성
- `typescript-strict.md` — TypeScript strict mode
- `file-size-limit.md` — 파일 크기 제한 (300/500줄)
- `no-dead-code.md` — 데드 코드 금지
- `be-territory.md` / `fe-territory.md` — 에이전트 영역 구분

## 검색

이 문서들을 검색하려면:
```
/qmd [검색어]
```
