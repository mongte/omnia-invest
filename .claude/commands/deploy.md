pharos-lab을 Vercel에 배포해줘.

## 순서

1. `apps/pharos-lab/` 디렉토리에서 배포 실행:
   - `$ARGUMENTS`에 "prod"가 포함되면: `cd apps/pharos-lab && vercel --prod --yes`
   - 그 외 (기본 preview): `cd apps/pharos-lab && vercel --yes`
2. 배포 완료 후 URL 출력
   - prod: https://pharos-lab.vercel.app
   - preview: 발급된 URL 출력
