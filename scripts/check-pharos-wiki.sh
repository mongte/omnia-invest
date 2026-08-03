#!/usr/bin/env bash
# Structural check: omnia-invest-doc/pharos-lab is a valid project-mode wiki-llm KB.
# Run from monorepo root: bash scripts/check-pharos-wiki.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KB="$ROOT/omnia-invest-doc/pharos-lab"
fail=0

ok() { echo "OK  $*"; }
bad() { echo "FAIL $*"; fail=1; }

# Layout
[[ -d "$KB/raw" ]] || bad "raw/ must be a directory"
[[ -d "$KB/raw" ]] && ok "raw/ directory"
[[ -d "$KB/wiki" ]] || bad "wiki/ missing"
[[ -d "$KB/wiki" ]] && ok "wiki/ directory"
[[ ! -f "$KB/raw.md" ]] || bad "empty raw.md must not exist (use raw/)"
[[ ! -f "$KB/raw.md" ]] && ok "no raw.md file"
[[ -f "$KB/CLAUDE.md" ]] || bad "knowledge-folder CLAUDE.md missing"
[[ -f "$KB/CLAUDE.md" ]] && ok "CLAUDE.md"

# CLAUDE reading rules (fixed-string: parentheses in MOC name)
for needle in "GRAPH_REPORT" "인덱스 (MOC)" "raw/"; do
  if rg -F -q "$needle" "$KB/CLAUDE.md"; then
    ok "CLAUDE.md mentions $needle"
  else
    bad "CLAUDE.md missing rule: $needle"
  fi
done

# MOC + required topic notes
MOC="$KB/wiki/인덱스 (MOC).md"
[[ -f "$MOC" ]] || bad "wiki/인덱스 (MOC).md missing"
[[ -f "$MOC" ]] && ok "MOC exists"

REQUIRED_NOTES=(
  "제품 개요와 스택"
  "FSD 앱 구조"
  "데이터 파이프라인과 Supabase"
  "투자 도메인 규칙"
)

for title in "${REQUIRED_NOTES[@]}"; do
  f="$KB/wiki/${title}.md"
  if [[ ! -f "$f" ]]; then
    bad "missing note: $f"
    continue
  fi
  ok "note: $title"
  if ! rg -q '^title:' "$f" || ! rg -q '^tags:' "$f" || ! rg -q '^status:' "$f" || ! rg -q '^updated:' "$f"; then
    bad "frontmatter incomplete: $title"
  else
    ok "frontmatter: $title"
  fi
  if ! rg -q '\[\[' "$f"; then
    bad "no wikilink in: $title"
  else
    ok "wikilink: $title"
  fi
  if ! rg -q "\[\[${title}\]\]" "$MOC"; then
    bad "MOC does not link [[$title]]"
  else
    ok "MOC links [[$title]]"
  fi
done

# Content grounding (facts from apps/pharos-lab investigation)
rg -q 'Next\.js 16' "$KB/wiki/제품 개요와 스택.md" || bad "overview missing Next.js 16"
rg -q 'app → views → widgets' "$KB/wiki/FSD 앱 구조.md" || bad "FSD note missing layer chain"
rg -q 'trading' "$KB/wiki/데이터 파이프라인과 Supabase.md" || bad "pipeline note missing trading schema"
rg -q '데일리 추천 랭킹' "$KB/wiki/투자 도메인 규칙.md" || bad "domain note missing ranking name"
ok "content grounding checks"

# Agent-facing guides point at this KB
for guide in "$ROOT/Claude.md" "$ROOT/apps/pharos-lab/CLAUDE.md"; do
  if rg -q 'omnia-invest-doc/pharos-lab' "$guide" && rg -q 'GRAPH_REPORT|인덱스 \(MOC\)' "$guide"; then
    ok "pointer in $(basename "$(dirname "$guide")")/$(basename "$guide")"
  else
    bad "missing wiki-llm pointer in $guide"
  fi
done

# Graphify outputs (optional pass if present non-empty)
if [[ -s "$ROOT/graphify-out/GRAPH_REPORT.md" ]] || [[ -s "$ROOT/graphify-out/graph.json" ]]; then
  ok "graphify-out evidence present"
else
  echo "WARN graphify-out/GRAPH_REPORT.md or graph.json missing (acceptable if env blocked extract)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "check-pharos-wiki: FAILED"
  exit 1
fi
echo
echo "check-pharos-wiki: PASSED"
exit 0
