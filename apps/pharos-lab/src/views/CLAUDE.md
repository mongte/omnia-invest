# views — 페이지 수준 데이터 조합

## 역할
- 위젯들을 조합하고 데이터를 wiring하는 레이어
- 각 위젯에 props로 데이터를 전달
- 상태 관리 (selectedStockId, selectedDisclosureId 등)

## 현재 상태 (교체 대상)
`dashboard-view.tsx`가 Mock 데이터(`shared/lib/mock-data.ts`)를 직접 참조 중.
→ `shared/api/` 페칭 함수로 교체 필요.

## 교체 패턴

### 초기 데이터: 서버 컴포넌트에서 fetch → props 전달
```typescript
// app/(shell)/dashboard/page.tsx (서버 컴포넌트)
const stocks = await fetchRankedStocks()
return <DashboardView initialStocks={stocks} />
```

### 동적 데이터: 종목 선택 시 클라이언트 fetch
```typescript
// views/dashboard/dashboard-view.tsx
useEffect(() => {
  fetchDisclosuresByStockId(selectedStockId).then(setDisclosures)
  fetchOhlcvByStockCode(stockCode).then(setOhlcv)
}, [selectedStockId])
```

## 위젯 props 인터페이스 (변경하지 말 것)
- `RankingList`: `{ stocks, selectedStockId, onSelectStock }`
- `ScoreRadar`: `{ stock }`
- `RankingChart`: `{ data: RankingHistory[], stocks: StockData[] }`
- `DisclosureTimeline`: `{ disclosures, selectedDisclosureId, onSelectDisclosure }`
- `LlmSummary`: `{ disclosure, summary }`
- `PriceChart`: `{ ohlcv, disclosures, selectedDisclosureId, onSelectDisclosure }`
