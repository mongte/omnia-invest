Git 변경사항을 분석해서 커밋 메시지를 작성하고 커밋해줘.
추가 컨텍스트: $ARGUMENTS

## 순서

1. `git diff --staged` 실행해서 staged 변경사항 확인
2. staged 변경사항이 없으면:
   - `git status` 로 변경 파일 목록 확인 후 사용자에게 보여줘
   - 어떤 파일을 add 할지 물어보고 진행
3. 변경사항 내용과 $ARGUMENTS 를 참고해서 커밋 메시지 작성:

### Summary 규칙 (50자 이내, 한글)
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링
- chore: 설정/의존성
- docs: 문서
- style: 스타일

예시: `feat: JWT 기반 사용자 인증 추가`

### Description 규칙 (한글)
- 무엇을, 왜 변경했는지 설명
- 주요 변경 파일 목록
- Breaking change 있으면 명시

4. 작성한 커밋 메시지를 먼저 보여주고 확인 후 커밋 실행
5. `git commit -m "summary" -m "description"` 실행
6. 커밋 완료 후 해시와 결과 출력