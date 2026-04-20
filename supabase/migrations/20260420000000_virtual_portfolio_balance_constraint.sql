-- virtual_portfolios: 잔고 음수 방지 제약 추가
-- 동시 주문 요청 시 DB 레벨에서 음수 잔고 차단
ALTER TABLE public.virtual_portfolios
  ADD CONSTRAINT chk_cash_balance_non_negative CHECK (cash_balance >= 0),
  ADD CONSTRAINT chk_reserved_cash_non_negative CHECK (reserved_cash >= 0);
