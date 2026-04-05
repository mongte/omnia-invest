---
paths:
  - "apps/pharos-lab/src/**/*.{ts,tsx}"
---

# FSD 레이어 의존성

상위 → 하위만 허용. 역방향 import 절대 금지.

```
app → views → widgets → features → entities → shared (OK)
entities → features (FORBIDDEN)
shared → entities (FORBIDDEN)
```

위반 필요 시 이벤트 버스나 콜백 패턴으로 우회.
