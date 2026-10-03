-- =============================================================================
-- Storage buckets and policies
--
--   media      public images (profile photo, project images, logos, blog
--              covers, OpenGraph image). Raster formats only — SVG is rejected
--              because it can carry scripts.
--   documents  public PDFs (the CV).
--
-- Files are publicly readable through their public URL (that is what makes a
-- bucket "public"). Listing, uploading, replacing and deleting are restricted
-- to administrators by the policies below.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
  ('documents', 'documents', true, 10485760,
    array['application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can list portfolio files"
  on storage.objects for select to authenticated
  using (bucket_id in ('media', 'documents') and (select public.is_admin()));

create policy "Admins can upload portfolio files"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('media', 'documents') and (select public.is_admin()));

create policy "Admins can update portfolio files"
  on storage.objects for update to authenticated
  using (bucket_id in ('media', 'documents') and (select public.is_admin()))
  with check (bucket_id in ('media', 'documents') and (select public.is_admin()));

create policy "Admins can delete portfolio files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('media', 'documents') and (select public.is_admin()));
