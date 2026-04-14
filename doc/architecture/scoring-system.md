# 3-Layer 스코어링 시스템

종목 분석을 위한 동적 가중치 기반 스코어링 구조.

## 레이어 구성

```
Layer 1: 기술적 분석 (Technical)
  - 모멘텀 지표 (RSI, MACD)
  - 거래량 분석
  - 가격 패턴

Layer 2: 펀더멘털 분석 (Fundamental)
  - 재무제표 (PER, PBR, ROE)
  - 공시 분석
  - 산업 내 상대 비교

Layer 3: 기관/외인 동향 (Institutional)
  - 기관 순매수/순매도
  - 외국인 지분율 변화
  - 관심 종목 신호
```

## 스코어 산출

각 레이어별 0-100점 → 동적 가중치 적용 → 최종 QUALITY_SCORE

가중치는 시장 상황에 따라 조정됩니다 (`data-analysis` 스킬 참고).

## 코드 위치

- 스킬: `.claude/skills/data-analysis/`
- DB 테이블: Supabase `scores`, `strategies` 테이블
- 분석 실행: `scripts/run_analysis.py`
