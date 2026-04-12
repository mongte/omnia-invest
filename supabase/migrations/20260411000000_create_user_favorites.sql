create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  stock_id text not null references public.stocks(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, stock_id)
);

alter table public.user_favorites enable row level security;

create policy "Users can read own favorites"
  on public.user_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.user_favorites for delete
  using (auth.uid() = user_id);
