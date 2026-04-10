-- profiles 테이블
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS 활성화
alter table public.profiles enable row level security;

-- 본인 프로필만 읽기 허용
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 본인 프로필만 수정 허용
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 신규 유저 가입 시 자동 profile 생성 함수
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

-- auth.users insert 시 트리거
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 자동 갱신 함수
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles updated_at 트리거
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();
