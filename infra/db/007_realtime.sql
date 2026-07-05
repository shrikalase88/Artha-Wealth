-- 007_realtime.sql
-- Subscribe these tables to Supabase Realtime so the frontend can react instantly.

alter publication supabase_realtime add table public.portfolios;
alter publication supabase_realtime add table public.assets;
alter publication supabase_realtime add table public.portfolio_metrics;
