pharos-lab의 QA 검증 체인을 실행합니다.
대상 URL: $ARGUMENTS (기본값: http://localhost:3000)

## 순서

1. dev 서버 상태 확인:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null
   ```
   - 200이면 서버 실행 중 → 다음 단계
   - 실패하면: "dev 서버가 실행되지 않습니다. `nx dev pharos-lab`을 먼저 실행하세요" 출력 후 종료

2. `/qa-only` 실행 — gstack 기반 기능 QA
   - 대상: `$ARGUMENTS` 또는 `http://localhost:3000`
   - 핵심 사용자 여정 검증 (로그인, 대시보드, 주식 분석)

3. `/design-review` 실행 — 시각적 일관성 검토
   - 대상: 동일 URL
   - 스타일 가이드 준수, 반응형, 접근성 확인

4. 종합 리포트 출력:
   - QA 통과 항목 / 실패 항목
   - 디자인 이슈 목록
   - 전체 판정: PASS / FAIL
