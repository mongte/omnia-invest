---
title: 인덱스 (MOC)
tags: [pharos-lab, moc, index]
status: done
updated: 2026-07-30
---

# 인덱스 (MOC) — pharos-lab

> 지식 베이스 시작점. Graphify 그래프가 없을 때 이 파일에서 위키링크를 따라 관련 노트만 읽는다. `raw/` 전체를 훑지 않는다.

## 제품·아키텍처

- [[제품 개요와 스택]] — 무엇을 하는 앱인지, 스택, 라우트, 현재 상태
- [[FSD 앱 구조]] — 레이어, path alias, 슬라이스, BE/FE 소유권

## 데이터·도메인

- [[데이터 파이프라인과 Supabase]] — ETL 스케줄, trading/public 스키마, 클라이언트, 스코어링
- [[투자 도메인 규칙]] — 권유 금지, 면책, 랭킹 명칭, 가상투자·auth gate

## 원본·지도

- 원본 스냅샷: `../raw/` (수정 금지; README/CLAUDE/아키텍처·도메인 스킬 사본)
- Graphify 지도: 모노레포 루트 `graphify-out/GRAPH_REPORT.md` → 관련 노드만

## 빌드 안내

모노레포 루트에서:

```bash
# 최초/전체 (에이전트 파이프라인 또는 graphify extract)
# 대상: ./omnia-invest-doc/pharos-lab
graphify update ./omnia-invest-doc/pharos-lab   # 코드·문서 변경 후 증분 (AST)
```

에이전트 규칙 상세: 지식 폴더 `omnia-invest-doc/pharos-lab/CLAUDE.md`
