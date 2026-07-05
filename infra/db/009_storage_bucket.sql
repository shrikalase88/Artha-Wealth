-- 009_storage_bucket.sql
-- Create the portfolio-statements storage bucket + RLS policy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-statements',
  'portfolio-statements',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "users_upload_own_statements"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio-statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own files
create policy "users_read_own_statements"
  on storage.objects for select
  using (
    bucket_id = 'portfolio-statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
