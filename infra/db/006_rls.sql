-- 006_rls.sql
-- Row Level Security: every table gated on auth.uid() = user_id (or id for profiles).

alter table public.profiles          enable row level security;
alter table public.portfolios        enable row level security;
alter table public.assets            enable row level security;
alter table public.portfolio_metrics enable row level security;

-- profiles --------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- portfolios ------------------------------------------------------------
create policy "portfolios_select_own"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "portfolios_insert_own"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "portfolios_update_own"
  on public.portfolios for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "portfolios_delete_own"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- assets ----------------------------------------------------------------
create policy "assets_select_own"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "assets_insert_own"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "assets_update_own"
  on public.assets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "assets_delete_own"
  on public.assets for delete
  using (auth.uid() = user_id);

-- portfolio_metrics -----------------------------------------------------
create policy "metrics_select_own"
  on public.portfolio_metrics for select
  using (auth.uid() = user_id);

create policy "metrics_insert_own"
  on public.portfolio_metrics for insert
  with check (auth.uid() = user_id);

create policy "metrics_update_own"
  on public.portfolio_metrics for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "metrics_delete_own"
  on public.portfolio_metrics for delete
  using (auth.uid() = user_id);
