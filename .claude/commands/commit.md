Git staged 변경사항을 분석해서 커밋 메시지를 작성하고 커밋해줘.

## 순서

1. `git diff --staged` 실행해서 변경사항 확인
2. 변경사항이 없으면 `git diff HEAD` 로 확인 후 `git add -A` 실행
3. 아래 규칙으로 커밋 메시지 작성:

### Summary 규칙 (50자 이내)
- feat: 새 기능
- fix: 버그 수정  
- refactor: 리팩토링
- chore: 설정/의존성
- docs: 문서
- style: 스타일
- 한글로 명시

예시: `feat: 권한 추가 작업`

### Description 규칙
- 무엇을, 왜 변경했는지 설명
- 주요 변경 파일 목록
- Breaking change 있으면 명시
- 한글로 명시

4. `git commit -m "summary" -m "description"` 실행
5. 커밋 완료 후 결과 출력