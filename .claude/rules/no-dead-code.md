---
paths:
  - "apps/*/src/**/*.{ts,tsx}"
---

# 데드 코드 금지

에이전트가 생성한 코드베이스는 시간이 지나면서 미사용 코드가 쌓입니다.
가비지 컬렉션을 원활히 하려면 데드 코드를 사전에 방지합니다.

## 금지 패턴

### 주석 처리된 코드
```typescript
// ❌ 금지
// const oldFunction = () => { ... }
// if (condition) { doSomething() }

// ✅ 허용 (설명 주석만)
// 이 함수는 X 이유로 Y 방식을 사용합니다
```

### 미사용 import
```typescript
// ❌ 금지
import { unusedComponent } from './Component'

// ✅ 사용하는 것만 import
import { UsedComponent } from './Component'
```

### 미사용 변수/함수
- TypeScript `noUnusedLocals: true`, `noUnusedParameters: true` 설정 준수
- 내보내기(export)하지 않는 미사용 함수는 삭제

## 예외

- `// TODO:` 주석은 허용 (단, 기술 부채 추적기에 등록 필요)
- `// @ts-ignore`는 금지. `// @ts-expect-error`로 대체 후 이유 명시
- 테스트 파일의 헬퍼 함수는 예외
