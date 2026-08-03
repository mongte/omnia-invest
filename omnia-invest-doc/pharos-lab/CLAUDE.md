# CLAUDE.md — omnia-invest-doc/pharos-lab (LLM Wiki)

이 폴더는 **pharos-lab** 지식 위키이자 Obsidian 보관함이다. LLM Wiki + Graphify 방식으로 운영한다.

## 질문에 답하기 전 (가장 중요)

1. 모노레포 루트의 `graphify-out/GRAPH_REPORT.md`를 먼저 읽는다.
2. 더 깊은 탐색은 `graphify query "<질문>"` 또는 `graphify-out/graph.json` (실행 cwd = 모노레포 루트).
3. 원본(`raw/`)과 전체 노트를 처음부터 다 읽지 않는다. 그래프로 먼저 탐색한다.
4. 답변 시 관계 신뢰도를 구분 (EXTRACTED=확실 / INFERRED=추론 / AMBIGUOUS=검토).
5. graph가 없으면 `wiki/인덱스 (MOC).md`를 시작점으로 위키링크를 따른다. **`raw/`를 wholesale-read 하지 않는다.**

## 폴더 구조 (raw + wiki + graphify-out)

- `raw/` — 변환·스냅샷된 원본 자료. **수정 금지.**
- `wiki/` — 가공한 지식 노트 + 인덱스(MOC).
- 모노레포 루트 `graphify-out/` — Graphify 생성물. **손으로 편집 금지.** (이 폴더 기준 상대 경로: `../../graphify-out/`)

## 새 자료가 들어오면

1. 새 원본을 `raw/`에 두고 관련 `wiki/` 노트를 업데이트하거나 새로 만든다.
2. `wiki/인덱스 (MOC).md`에 위키링크 추가.
3. 변경 노트의 frontmatter `updated` 갱신.
4. 지도 갱신은 모노레포 루트에서 `./omnia-invest-doc/pharos-lab` 대상 Graphify 실행에 위임 (수동으로 graph.json/GRAPH_REPORT 편집 금지).

## 노트 작성 규칙

- 모든 노트 최상단 frontmatter: `title`, `tags`, `status`, `updated`.
- 노트 간 연결은 위키링크 `[[노트제목]]`.
- 한 노트 = 한 주제. 미확인 내용은 `status: review`.

## 토픽 맵 (요약)

| 노트 | 내용 |
|------|------|
| 제품 개요와 스택 | 제품 정의, 스택, 라우트 |
| FSD 앱 구조 | 레이어·alias·소유권 |
| 데이터 파이프라인과 Supabase | ETL·스키마·스코어링 |
| 투자 도메인 규칙 | 컴플라이언스·랭킹·auth |
