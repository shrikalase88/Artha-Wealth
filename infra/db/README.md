# Database (Supabase PostgreSQL)

All SQL lives here. Run files in numeric order against the Supabase project
(SQL Editor → New Query, or `supabase db push` if linking a local migration
directory).

| File                          | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `001_extensions.sql`          | `uuid-ossp`, `pgcrypto`.                                  |
| `002_enums.sql`               | `asset_type`, `asset_class`, `currency_code`, `upload_status`. |
| `003_tables.sql`              | `profiles`, `portfolios`, `assets`, `portfolio_metrics`.  |
| `004_indexes.sql`             | Indexes for hot read paths.                               |
| `005_triggers.sql`            | `set_updated_at`, `handle_new_user`.                      |
| `006_rls.sql`                 | Row Level Security policies.                              |
| `007_realtime.sql`            | Add tables to `supabase_realtime` publication.            |
| `seed/seed.sql`               | Optional dev seed data (never run in prod).               |

The full, copy-pasteable schema from Step 1 was split across these files so
each can be replayed cleanly via the Supabase migration runner.
