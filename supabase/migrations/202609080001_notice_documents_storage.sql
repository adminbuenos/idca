-- ============================================================
-- IDCA Notice Document Storage
-- Migration: 202609080001_notice_documents_storage.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create private bucket for official notice files
-- ------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'idca-notices',
  'idca-notices',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ------------------------------------------------------------
-- 2. Authorized users can upload notice files
-- ------------------------------------------------------------

drop policy if exists authorized_upload_idca_notice_documents
on storage.objects;

create policy authorized_upload_idca_notice_documents
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'idca-notices'
  and public.current_user_has_permission(
    'notice.edit'::text,
    '89304127-99c2-4427-8edd-87a9aff3e167'::uuid
  )
);


-- ------------------------------------------------------------
-- 3. Authorized users can update notice files
-- ------------------------------------------------------------

drop policy if exists authorized_update_idca_notice_documents
on storage.objects;

create policy authorized_update_idca_notice_documents
on storage.objects
for update
to authenticated
using (
  bucket_id = 'idca-notices'
  and public.current_user_has_permission(
    'notice.edit'::text,
    '89304127-99c2-4427-8edd-87a9aff3e167'::uuid
  )
)
with check (
  bucket_id = 'idca-notices'
  and public.current_user_has_permission(
    'notice.edit'::text,
    '89304127-99c2-4427-8edd-87a9aff3e167'::uuid
  )
);


-- ------------------------------------------------------------
-- 4. Authorized users can delete notice files
-- ------------------------------------------------------------

drop policy if exists authorized_delete_idca_notice_documents
on storage.objects;

create policy authorized_delete_idca_notice_documents
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'idca-notices'
  and public.current_user_has_permission(
    'notice.edit'::text,
    '89304127-99c2-4427-8edd-87a9aff3e167'::uuid
  )
);