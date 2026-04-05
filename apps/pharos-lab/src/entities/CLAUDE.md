# entities — 도메인 타입 + 스토어

## 역할
- 도메인 모델 타입 정의
- Zustand 스토어 (필요 시)
- BE 소유 — FE는 import만

## stock/types.ts (현재 정의됨)

```typescript
StockScore     { fundamental, momentum, disclosure, institutional, total }
StockData      { id, code, name, price, change, changeRate, score, rank, scoreDescriptions[] }
DisclosureType = 'earnings' | 'ownership' | 'other'
DisclosureEvent { id, stockId, date, title, type, importance }
OHLCVData      { time, open, high, low, close, volume }
RankingHistory { date, [stockId]: number }
```

## 추가 필요 타입
```typescript
LlmSummaryData { points: string[], sentiment: 'positive'|'negative'|'neutral', impact: string }
```

## DB → 프론트 타입 매핑
| DB 컬럼 (snake_case) | 프론트 필드 (camelCase) |
|----------------------|----------------------|
| stocks.change_rate | StockData.changeRate |
| stocks.id | StockData.id |
| stocks.code | StockData.code |
| stock_scores.* | StockData.score.* |
| disclosures.disclosure_date | DisclosureEvent.date |
| disclosures.stock_id | DisclosureEvent.stockId |
| ohlcv_daily.trade_date | OHLCVData.time |
| ohlcv_daily.open_price | OHLCVData.open |
