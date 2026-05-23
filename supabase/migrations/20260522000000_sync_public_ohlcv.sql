-- trading.ohlcv_daily → public.ohlcv 동기화 함수
--
-- public.ohlcv 는 앱 차트(fetchOhlcv)의 데이터 소스이지만 일회성 시드 이후
-- 자동 동기화 경로가 없어 차트가 과거 시점에 멈추는 문제가 있었다.
-- sync_to_public_stocks() / sync_to_public_disclosures() 와 동일한 패턴으로
-- OHLCV 동기화 함수를 추가한다.

-- INSERT 시 id/created_at 가 생략되어도 채워지도록 기본값 보장
alter table public.ohlcv alter column id set default gen_random_uuid();
alter table public.ohlcv alter column created_at set default now();

create or replace function trading.sync_to_public_ohlcv(p_from_date date default null)
returns integer language plpgsql as $func$
declare
  synced integer := 0;
  v_from date := coalesce(p_from_date, current_date - 7);
begin
  -- 동기화 윈도우를 전체 갱신 (지연 정정 데이터 반영)
  delete from public.ohlcv where trade_date >= v_from;

  insert into public.ohlcv (stock_id, trade_date, open, high, low, close, volume)
  select distinct on (od.stock_code, od.trade_date)
    od.stock_code, od.trade_date,
    od.open_price, od.high_price, od.low_price, od.close_price, od.volume
  from trading.ohlcv_daily od
  inner join public.stocks s on s.id = od.stock_code
  where od.trade_date >= v_from
  order by od.stock_code, od.trade_date, od.market;

  get diagnostics synced = row_count;
  return synced;
end;
$func$;
