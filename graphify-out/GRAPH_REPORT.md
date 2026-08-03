# Graph Report - omnia-invest-doc/pharos-lab  (2026-07-30)

## Corpus Check
- Corpus is ~4,582 words - fits in a single context window. You may not need a graph.

## Summary
- 29 nodes · 33 edges · 5 communities
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.91)
- Token cost: 4,500 input · 2,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_FSD and Wiki Index|FSD and Wiki Index]]
- [[_COMMUNITY_Product Routes Auth|Product Routes Auth]]
- [[_COMMUNITY_Domain Compliance Ranking|Domain Compliance Ranking]]
- [[_COMMUNITY_ETL and Scoring Pipeline|ETL and Scoring Pipeline]]
- [[_COMMUNITY_Supabase Schemas API|Supabase Schemas API]]

## God Nodes (most connected - your core abstractions)
1. `pharos-lab` - 9 edges
2. `FSD layer stack` - 6 edges
3. `Kiwoom OpenDART ETL flow` - 5 edges
4. `investment solicitation ban` - 5 edges
5. `인덱스 (MOC)` - 5 edges
6. `3-Layer scoring` - 4 edges
7. `trading schema` - 3 edges
8. `데일리 추천 랭킹` - 3 edges
9. `/dashboard route` - 2 edges
10. `/virtual-trading route` - 2 edges

## Surprising Connections (you probably didn't know these)
- `pharos-lab README` --semantically_similar_to--> `pharos-lab`  [INFERRED] [semantically similar]
  omnia-invest-doc/pharos-lab/raw/pharos-lab-readme.md → omnia-invest-doc/pharos-lab/wiki/제품 개요와 스택.md
- `FSD layer stack` --semantically_similar_to--> `FSD import direction rule`  [INFERRED] [semantically similar]
  omnia-invest-doc/pharos-lab/wiki/FSD 앱 구조.md → omnia-invest-doc/pharos-lab/raw/fsd-layers.md
- `FSD layer stack` --semantically_similar_to--> `pharos-fsd skill`  [INFERRED] [semantically similar]
  omnia-invest-doc/pharos-lab/wiki/FSD 앱 구조.md → omnia-invest-doc/pharos-lab/raw/pharos-fsd-skill.md
- `investment solicitation ban` --semantically_similar_to--> `pharos-domain skill`  [INFERRED] [semantically similar]
  omnia-invest-doc/pharos-lab/wiki/투자 도메인 규칙.md → omnia-invest-doc/pharos-lab/raw/pharos-domain-skill.md
- `3-Layer scoring` --semantically_similar_to--> `scoring-system 3-Layer doc`  [INFERRED] [semantically similar]
  omnia-invest-doc/pharos-lab/wiki/데이터 파이프라인과 Supabase.md → omnia-invest-doc/pharos-lab/raw/scoring-system.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **pharos-lab core knowledge topics** — wiki_product_overview_stack_pharos_lab, wiki_fsd_app_structure_fsd_layers, wiki_data_pipeline_supabase_etl_flow, wiki_investment_domain_rules_no_solicitation [EXTRACTED 1.00]
- **ETL to public schema to dashboard** — wiki_data_pipeline_supabase_etl_flow, wiki_data_pipeline_supabase_trading_schema, wiki_data_pipeline_supabase_public_schema, wiki_product_overview_stack_dashboard_route [EXTRACTED 1.00]

## Communities (5 total, 0 thin omitted)

### Community 0 - "FSD and Wiki Index"
Cohesion: 0.29
Nodes (7): LLM Wiki + Graphify rules, FSD import direction rule, pharos-fsd skill, BE vs FE ownership, FSD layer stack, Path aliases @/*, 인덱스 (MOC)

### Community 1 - "Product Routes Auth"
Cohesion: 0.29
Nodes (7): pharos-lab README, auth gate pattern, virtual trading order flow, /my-stocks route, Next.js 16 App Router stack, pharos-lab, /virtual-trading route

### Community 2 - "Domain Compliance Ranking"
Cohesion: 0.33
Nodes (6): pharos-domain skill, quant_score, 데일리 추천 랭킹, disclaimer placement, investment solicitation ban, /dashboard route

### Community 3 - "ETL and Scoring Pipeline"
Cohesion: 0.40
Nodes (5): daily_sync_kiwoom.py, run_analysis.py, scoring-system 3-Layer doc, Kiwoom OpenDART ETL flow, 3-Layer scoring

### Community 4 - "Supabase Schemas API"
Cohesion: 0.50
Nodes (4): ohlcv_daily, public schema, trading schema, shared/api Supabase clients

## Knowledge Gaps
- **14 isolated node(s):** `Next.js 16 App Router stack`, `Path aliases @/*`, `shared/api Supabase clients`, `ohlcv_daily`, `disclaimer placement` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pharos-lab` connect `Product Routes Auth` to `FSD and Wiki Index`, `Domain Compliance Ranking`, `ETL and Scoring Pipeline`?**
  _High betweenness centrality (0.562) - this node is a cross-community bridge._
- **Why does `Kiwoom OpenDART ETL flow` connect `ETL and Scoring Pipeline` to `FSD and Wiki Index`, `Product Routes Auth`, `Supabase Schemas API`?**
  _High betweenness centrality (0.460) - this node is a cross-community bridge._
- **Why does `FSD layer stack` connect `FSD and Wiki Index` to `Product Routes Auth`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `FSD layer stack` (e.g. with `FSD import direction rule` and `pharos-fsd skill`) actually correct?**
  _`FSD layer stack` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Next.js 16 App Router stack`, `Path aliases @/*`, `BE vs FE ownership` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._