-- seed/seed.sql
-- DEV-ONLY seed data. Do NOT run in production.
-- Assumes a test auth user has been created via `supabase auth signup`
-- and that auth.users id = '00000000-0000-0000-0000-000000000001'.

insert into public.profiles (id, email, full_name, base_currency)
values ('00000000-0000-0000-0000-000000000001', 'demo@artha.local', 'Demo User', 'INR')
on conflict (id) do nothing;

insert into public.portfolios (id, user_id, name, description, upload_status, total_invested, total_value, currency, as_of_date)
values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Demo Portfolio',
  'Seed portfolio for local dev',
  'completed',
  500000.0000,
  542310.7500,
  'INR',
  current_date
)
on conflict do nothing;

insert into public.assets (
  portfolio_id, user_id, asset_type, asset_class, ticker, name,
  quantity, average_buy_price, cost_basis, current_price, market_value, currency
) values
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'equity', 'large_cap', 'RELIANCE.NS', 'Reliance Industries',
  25, 2400.00, 60000.0000, 2780.50, 69512.5000, 'INR'
),
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'mutual_fund', 'large_cap', '119551', 'Parag Parikh Flexi Cap',
  1500.1234, 65.50, 98258.0800, 71.20, 106808.7900, 'INR'
)
on conflict do nothing;
