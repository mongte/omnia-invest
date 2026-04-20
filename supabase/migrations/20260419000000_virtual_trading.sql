-- 1) 가상 포트폴리오 (유저당 1개, 초기 가상 자금 10,000,000원)
create table if not exists public.virtual_portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cash_balance numeric(14,2) not null default 10000000,
  reserved_cash numeric(14,2) not null default 0,
  initial_balance numeric(14,2) not null default 10000000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.virtual_portfolios enable row level security;
create policy "users can manage own virtual portfolio"
  on public.virtual_portfolios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) 자동매매 규칙 (virtual_orders에서 FK 참조하므로 먼저 생성)
create table if not exists public.auto_trade_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stock_id text references public.stocks(id) on delete cascade,
  rule_type text not null check (rule_type in ('take_profit','stop_loss','limit_buy','signal_buy','signal_sell')),
  trigger_price numeric(14,2),
  trigger_signal text,
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (status in ('active','triggered','cancelled')),
  created_at timestamptz default now(),
  triggered_at timestamptz
);
alter table public.auto_trade_rules enable row level security;
create policy "users can manage own auto rules"
  on public.auto_trade_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) 가상 포지션
create table if not exists public.virtual_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stock_id text references public.stocks(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  avg_cost numeric(14,2) not null,
  updated_at timestamptz default now(),
  unique(user_id, stock_id)
);
alter table public.virtual_positions enable row level security;
create policy "users can manage own virtual positions"
  on public.virtual_positions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) 주문·체결 이력
create table if not exists public.virtual_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stock_id text references public.stocks(id),
  side text not null check (side in ('buy','sell')),
  order_type text not null check (order_type in ('market','limit_buy','take_profit','stop_loss','signal_buy','signal_sell')),
  quantity integer not null check (quantity > 0),
  price numeric(14,2) not null,
  total_amount numeric(14,2) not null,
  rule_id uuid references public.auto_trade_rules(id) on delete set null,
  executed_at timestamptz default now()
);
alter table public.virtual_orders enable row level security;
create policy "users can manage own virtual orders"
  on public.virtual_orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5) 일별 자산 스냅샷 (추이 차트용)
create table if not exists public.virtual_equity_snapshots (
  user_id uuid references auth.users(id) on delete cascade,
  snapshot_date date not null,
  cash_balance numeric(14,2) not null,
  market_value numeric(14,2) not null,
  total_equity numeric(14,2) not null,
  primary key(user_id, snapshot_date)
);
alter table public.virtual_equity_snapshots enable row level security;
create policy "users can manage own equity snapshots"
  on public.virtual_equity_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6) 신규 유저 가입 시 가상 포트폴리오 자동 초기화 트리거
create or replace function public.handle_new_virtual_portfolio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.virtual_portfolios(user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- profiles 생성 후 바로 virtual_portfolios도 생성 (handle_new_user와 같은 구조)
create or replace trigger on_virtual_portfolio_init
  after insert on public.profiles
  for each row execute procedure public.handle_new_virtual_portfolio();
