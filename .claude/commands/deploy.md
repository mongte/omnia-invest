pharos-lab을 Vercel에 배포해줘.
추가 컨텍스트: $ARGUMENTS

## 순서

1. `git status`로 커밋되지 않은 변경사항 확인
   - 변경사항이 있으면 먼저 커밋할지 사용자에게 물어보기
2. 빌드 확인: `npx nx build pharos-lab` 실행
   - 빌드 실패 시 에러 보여주고 중단
3. 배포 실행:
   - `$ARGUMENTS`에 "prod" 또는 "production"이 포함되면: `cd apps/pharos-lab && vercel --prod --yes`
   - 그 외: `cd apps/pharos-lab && vercel --yes` (preview 배포)
   - 작업 디렉토리: `apps/pharos-lab/`
4. 배포 결과 URL 출력
5. 배포 성공/실패 여부 안내
