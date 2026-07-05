-- =============================================================
-- ARTHA WEALTH — Full Database Migration
-- Run this in Supabase SQL Editor (1-shot, idempotent)
-- Order: extensions → enums → tables → indexes → triggers → rls → realtime
-- =============================================================

-- 001: Extensions -------------------------------------------------
create extension if not exists "pgcrypto";
-- uuid-ossp may not be available; we use gen_random_uuid() from pgcrypto instead.

-- 002: Enums ------------------------------------------------------
do $$ begin
  create type asset_type as enum (
    'equity', 'mutual_fund', 'etf', 'bond', 'cash', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type asset_class as enum (
    'domestic_equity', 'international_equity', 'large_cap', 'mid_cap', 'small_cap',
    'debt', 'hybrid', 'commodity', 'cash', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type currency_code as enum (
    'INR', 'USD', 'EUR', 'GBP', 'JPY', 'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type upload_status as enum (
    'pending', 'processing', 'completed', 'failed'
  );
exception when duplicate_object then null;
end $$;

-- 003: Tables -----------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  avatar_url      text,
  base_currency   currency_code not null default 'INR',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.portfolios (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  description       text,
  source_file_path  text,
  upload_status     upload_status not null default 'pending',
  parse_error       text,
  total_invested    numeric(18, 4),
  total_value       numeric(18, 4),
  total_gain        numeric(18, 4) generated always as (total_value - total_invested) stored,
  currency          currency_code not null default 'INR',
  as_of_date        date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.assets (
  id                uuid primary key default gen_random_uuid(),
  portfolio_id      uuid not null references public.portfolios(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  asset_type        asset_type not null,
  asset_class       asset_class not null default 'other',
  ticker            text,
  scheme_code       text,
  name              text not null,
  isin              text,
  quantity          numeric(18, 6) not null,
  average_buy_price numeric(18, 6),
  cost_basis        numeric(18, 4),
  current_price     numeric(18, 6),
  market_value      numeric(18, 4),
  unrealized_gain   numeric(18, 4) generated always as (market_value - cost_basis) stored,
  currency          currency_code not null default 'INR',
  last_price_at     timestamptz,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint assets_quantity_positive check (quantity > 0),
  constraint assets_ticker_or_scheme  check (ticker is not null or scheme_code is not null)
);

create table if not exists public.portfolio_metrics (
  id              uuid primary key default gen_random_uuid(),
  portfolio_id    uuid not null references public.portfolios(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  metric_date     date not null,
  metric_name     text not null,
  metric_value    numeric(18, 6),
  payload         jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (portfolio_id, metric_date, metric_name)
);

-- 004: Indexes ----------------------------------------------------
create index if not exists portfolios_user_id_idx          on public.portfolios(user_id);
create index if not exists portfolios_upload_status_idx    on public.portfolios(upload_status);
create index if not exists assets_portfolio_id_idx         on public.assets(portfolio_id);
create index if not exists assets_user_id_idx              on public.assets(user_id);
create index if not exists assets_ticker_idx               on public.assets(ticker)        where ticker is not null;
create index if not exists assets_scheme_code_idx          on public.assets(scheme_code)   where scheme_code is not null;
create index if not exists portfolio_metrics_portfolio_idx on public.portfolio_metrics(portfolio_id);

-- 005: Triggers ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger trg_portfolios_updated_at
    before update on public.portfolios
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger trg_assets_updated_at
    before update on public.assets
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when duplicate_object then null;
end $$;

-- 006: Row Level Security -----------------------------------------
alter table public.profiles          enable row level security;
alter table public.portfolios        enable row level security;
alter table public.assets            enable row level security;
alter table public.portfolio_metrics enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- portfolios
drop policy if exists "portfolios_select_own" on public.portfolios;
create policy "portfolios_select_own" on public.portfolios for select using (auth.uid() = user_id);
drop policy if exists "portfolios_insert_own" on public.portfolios;
create policy "portfolios_insert_own" on public.portfolios for insert with check (auth.uid() = user_id);
drop policy if exists "portfolios_update_own" on public.portfolios;
create policy "portfolios_update_own" on public.portfolios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "portfolios_delete_own" on public.portfolios;
create policy "portfolios_delete_own" on public.portfolios for delete using (auth.uid() = user_id);

-- assets
drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own" on public.assets for select using (auth.uid() = user_id);
drop policy if exists "assets_insert_own" on public.assets;
create policy "assets_insert_own" on public.assets for insert with check (auth.uid() = user_id);
drop policy if exists "assets_update_own" on public.assets;
create policy "assets_update_own" on public.assets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "assets_delete_own" on public.assets;
create policy "assets_delete_own" on public.assets for delete using (auth.uid() = user_id);

-- portfolio_metrics
drop policy if exists "metrics_select_own" on public.portfolio_metrics;
create policy "metrics_select_own" on public.portfolio_metrics for select using (auth.uid() = user_id);
drop policy if exists "metrics_insert_own" on public.portfolio_metrics;
create policy "metrics_insert_own" on public.portfolio_metrics for insert with check (auth.uid() = user_id);
drop policy if exists "metrics_update_own" on public.portfolio_metrics;
create policy "metrics_update_own" on public.portfolio_metrics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "metrics_delete_own" on public.portfolio_metrics;
create policy "metrics_delete_own" on public.portfolio_metrics for delete using (auth.uid() = user_id);

-- 007: Realtime ----------------------------------------------------
alter publication supabase_realtime add table public.portfolios;
alter publication supabase_realtime add table public.assets;
alter publication supabase_realtime add table public.portfolio_metrics;

-- =============================================================
-- DONE. Verify with:
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_type = 'BASE TABLE';
-- =============================================================
