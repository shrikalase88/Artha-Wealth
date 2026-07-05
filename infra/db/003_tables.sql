-- 003_tables.sql
-- Core domain tables: profiles, portfolios, assets, portfolio_metrics.

-- profiles: 1-to-1 mirror of auth.users for app-level user data.
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  avatar_url      text,
  base_currency   currency_code not null default 'INR',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- portfolios: a container for one uploaded statement / account.
create table public.portfolios (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  description       text,
  source_file_path  text,                                    -- path in Supabase Storage
  upload_status     upload_status not null default 'pending',
  parse_error       text,
  total_invested    numeric(18, 4),                          -- sum of cost basis
  total_value       numeric(18, 4),                          -- sum of market value
  total_gain        numeric(18, 4) generated always as (total_value - total_invested) stored,
  currency          currency_code not null default 'INR',
  as_of_date        date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- assets: individual holdings within a portfolio.
create table public.assets (
  id                uuid primary key default uuid_generate_v4(),
  portfolio_id      uuid not null references public.portfolios(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade, -- denormalized for RLS speed
  asset_type        asset_type not null,
  asset_class       asset_class not null default 'other',
  ticker            text,                                   -- e.g. "RELIANCE.NS", "AAPL"
  scheme_code       text,                                   -- MFAPI scheme code
  name              text not null,                          -- e.g. "Parag Parikh Flexi Cap"
  isin              text,
  quantity          numeric(18, 6) not null,
  average_buy_price numeric(18, 6),
  cost_basis        numeric(18, 4),                         -- quantity * avg price
  current_price     numeric(18, 6),
  market_value      numeric(18, 4),                         -- quantity * current price
  unrealized_gain   numeric(18, 4) generated always as (market_value - cost_basis) stored,
  currency          currency_code not null default 'INR',
  last_price_at     timestamptz,
  metadata          jsonb default '{}'::jsonb,              -- free-form (sector, expense ratio, etc.)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint assets_quantity_positive check (quantity > 0),
  constraint assets_ticker_or_scheme  check (ticker is not null or scheme_code is not null)
);

-- portfolio_metrics: time-series portfolio analytics (Sharpe, vol, allocation snapshots).
create table public.portfolio_metrics (
  id              uuid primary key default uuid_generate_v4(),
  portfolio_id    uuid not null references public.portfolios(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  metric_date     date not null,
  metric_name     text not null,                            -- 'sharpe', 'volatility', 'allocation_equity', etc.
  metric_value    numeric(18, 6),
  payload         jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (portfolio_id, metric_date, metric_name)
);
