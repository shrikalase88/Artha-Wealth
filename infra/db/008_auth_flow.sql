-- 008_auth_flow.sql
-- Add country/city to profiles + auto-confirm users on signup.

alter table public.profiles
  add column if not exists country text,
  add column if not exists city text;

-- Auto-confirm new users so signup redirects straight to dashboard
create or replace function public.auto_confirm_user()
returns trigger
language plpgsql
security definer
set search_path = auth
as $$
begin
  update auth.users set email_confirmed_at = now() where id = new.id;
  return new;
end;
$$;

do $$ begin
  create trigger on_user_created_auto_confirm
    after insert on auth.users
    for each row execute function public.auto_confirm_user();
exception when duplicate_object then null;
end $$;

-- Update the profile-creation trigger to pull country/city from metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, country, city)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city'
  );
  return new;
end;
$$;
