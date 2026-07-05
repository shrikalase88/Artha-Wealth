-- 004_indexes.sql
-- Indexes for the common access paths used by the frontend + backend.

create index portfolios_user_id_idx          on public.portfolios(user_id);
create index portfolios_upload_status_idx    on public.portfolios(upload_status);

create index assets_portfolio_id_idx         on public.assets(portfolio_id);
create index assets_user_id_idx              on public.assets(user_id);
create index assets_ticker_idx               on public.assets(ticker)        where ticker is not null;
create index assets_scheme_code_idx          on public.assets(scheme_code)   where scheme_code is not null;

create index portfolio_metrics_portfolio_idx on public.portfolio_metrics(portfolio_id);
