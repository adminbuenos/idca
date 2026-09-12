-- ============================================================
-- IDCA Notice Documents RLS
-- Migration: 202609080002_notice_documents_rls.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Documents table RLS
-- ------------------------------------------------------------

alter table public.documents enable row level security;

drop policy if exists authorized_users_read_notice_documents
on public.documents;

create policy authorized_users_read_notice_documents
on public.documents
for select
to authenticated
using (
  public.current_user_has_permission(
    'notice.edit'::text,
    division_id
  )
  or
  (
    visibility = 'PUBLIC'::visibility_type
    and exists (
      select 1
      from public.notice_documents nd
      join public.notices n
        on n.id = nd.notice_id
      where nd.document_id = documents.id
        and n.division_id = documents.division_id
        and n.status = 'PUBLISHED'::notice_status
    )
  )
);

drop policy if exists authorized_users_create_notice_documents
on public.documents;

create policy authorized_users_create_notice_documents
on public.documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.current_user_has_permission(
    'notice.edit'::text,
    division_id
  )
);

drop policy if exists authorized_users_update_notice_documents
on public.documents;

create policy authorized_users_update_notice_documents
on public.documents
for update
to authenticated
using (
  public.current_user_has_permission(
    'notice.edit'::text,
    division_id
  )
)
with check (
  public.current_user_has_permission(
    'notice.edit'::text,
    division_id
  )
);

drop policy if exists authorized_users_delete_notice_documents
on public.documents;

create policy authorized_users_delete_notice_documents
on public.documents
for delete
to authenticated
using (
  public.current_user_has_permission(
    'notice.edit'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- 2. Notice-document link table RLS
-- ------------------------------------------------------------

alter table public.notice_documents enable row level security;

drop policy if exists public_read_published_notice_documents
on public.notice_documents;

create policy public_read_published_notice_documents
on public.notice_documents
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.notices n
    where n.id = notice_documents.notice_id
      and n.status = 'PUBLISHED'::notice_status
  )
);

drop policy if exists authorized_users_read_notice_document_links
on public.notice_documents;

create policy authorized_users_read_notice_document_links
on public.notice_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.notices n
    where n.id = notice_documents.notice_id
      and public.current_user_has_permission(
        'notice.edit'::text,
        n.division_id
      )
  )
);

drop policy if exists authorized_users_create_notice_document_links
on public.notice_documents;

create policy authorized_users_create_notice_document_links
on public.notice_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.notices n
    join public.documents d
      on d.id = notice_documents.document_id
    where n.id = notice_documents.notice_id
      and d.division_id = n.division_id
      and public.current_user_has_permission(
        'notice.edit'::text,
        n.division_id
      )
  )
);

drop policy if exists authorized_users_delete_notice_document_links
on public.notice_documents;

create policy authorized_users_delete_notice_document_links
on public.notice_documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.notices n
    where n.id = notice_documents.notice_id
      and public.current_user_has_permission(
        'notice.edit'::text,
        n.division_id
      )
  )
);


-- ------------------------------------------------------------
-- 3. Helpful indexes
-- ------------------------------------------------------------

create index if not exists idx_notice_documents_notice_id
on public.notice_documents (notice_id);

create index if not exists idx_notice_documents_document_id
on public.notice_documents (document_id);

create index if not exists idx_documents_division_id
on public.documents (division_id);