pharos-lab을 Vercel에 배포해줘.

## 순서

### 1단계: Pre-deploy 검증
```bash
# 타입 체크
cd apps/pharos-lab && npx tsc --noEmit
```
타입 에러가 있으면 배포 중단 후 에러 목록 출력.

```bash
# FSD 아키텍처 검증
bash scripts/check-fsd-deps.sh
```
FSD 위반이 있으면 경고 출력 (배포는 계속 진행, 단 위반 내용 보고).

### 2단계: 배포 실행
- `$ARGUMENTS`에 "prod"가 포함되면: `cd apps/pharos-lab && vercel --prod --yes`
- 그 외 (기본 preview): `cd apps/pharos-lab && vercel --yes`

배포 완료 후 URL 출력.

### 3단계: Post-deploy 검증 (prod일 때만)

**3a. gstack QA**
`/qa-only` 실행 — 배포된 URL 대상으로 기능 검증

**3b. Canary 모니터링**
`/canary` 실행 — 5분간 에러율, 응답 시간 모니터링

### 4단계: 결과 보고
- 검증 통과 → 배포 완료 + URL
- 검증 실패 → 롤백 안내:
  ```bash
  # 이전 배포로 롤백
  cd apps/pharos-lab && vercel rollback
  ```
