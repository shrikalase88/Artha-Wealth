-- 001_extensions.sql
-- Required Postgres extensions for the Artha Wealth schema.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
