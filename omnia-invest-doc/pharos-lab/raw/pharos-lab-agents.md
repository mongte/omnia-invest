<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.
Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 에이전트 역할 분담

## BE 담당
- `src/shared/api/` — Supabase 데이터 페칭 함수
- `src/entities/*/types.ts` — 도메인 타입 정의
- `src/entities/*/api/` — 엔티티별 API 레이어
- `src/app/api/` — Route Handlers

## FE 담당
- `src/views/` — 페이지 뷰 (데이터 wiring)
- `src/widgets/` — UI 위젯 (props 기반)
- `src/shared/ui/` — 공유 UI 컴포넌트
- `src/app/(shell)/` — 레이아웃, 페이지 서버 컴포넌트

## 공유 영역
- `src/entities/*/types.ts` — BE 소유, FE는 import만
- `src/shared/lib/` — 유틸리티 (생성자 소유)
- `src/features/` — api/model은 BE, ui는 FE
