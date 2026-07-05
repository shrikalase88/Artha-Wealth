-- 002_enums.sql
-- Domain enums reused across tables.

create type asset_type as enum (
  'equity',
  'mutual_fund',
  'etf',
  'bond',
  'cash',
  'other'
);

create type asset_class as enum (
  'domestic_equity',
  'international_equity',
  'large_cap',
  'mid_cap',
  'small_cap',
  'debt',
  'hybrid',
  'commodity',
  'cash',
  'other'
);

create type currency_code as enum (
  'INR',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'OTHER'
);

create type upload_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);
