-- ============================================================
-- Supabase Auth: profiles 테이블
-- 다른 프로젝트에서 사용 시 그대로 복사하여 마이그레이션 적용
-- ============================================================

-- 1. profiles 테이블
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. RLS 활성화
alter table public.profiles enable row level security;

-- 3. 본인 프로필만 읽기 허용
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. 본인 프로필만 수정 허용
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. 신규 유저 가입 시 자동 profile 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. updated_at 자동 갱신
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();
