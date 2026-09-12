-- ============================================================
-- IDCA Notices Security Foundation
-- Migration: 202609070001_notices_security_foundation.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create notice permissions
-- ------------------------------------------------------------

insert into public.permissions (
  code,
  name,
  description,
  module
)
values
  (
    'notice.create',
    'Create Notices',
    'Create new notices and save them as drafts.',
    'notices'
  ),
  (
    'notice.edit',
    'Edit Notices',
    'Edit existing notices before publication.',
    'notices'
  ),
  (
    'notice.publish',
    'Publish Notices',
    'Publish notices to the public website.',
    'notices'
  ),
  (
    'notice.archive',
    'Archive Notices',
    'Archive published notices.',
    'notices'
  )
on conflict (code) do nothing;


-- ------------------------------------------------------------
-- 2. Assign permissions to system roles
-- ------------------------------------------------------------

-- ADMIN
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'ADMIN'
  and p.code in (
    'notice.create',
    'notice.edit',
    'notice.publish',
    'notice.archive'
  )
on conflict do nothing;


-- SUPER_ADMIN
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'SUPER_ADMIN'
  and p.code in (
    'notice.create',
    'notice.edit',
    'notice.publish',
    'notice.archive'
  )
on conflict do nothing;


-- CONTENT_MANAGER
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'CONTENT_MANAGER'
  and p.code in (
    'notice.create',
    'notice.edit',
    'notice.publish'
  )
on conflict do nothing;


-- ------------------------------------------------------------
-- 3. Enable RLS
-- ------------------------------------------------------------

alter table public.notices
enable row level security;


-- ------------------------------------------------------------
-- 4. Public users may read ONLY published notices
-- ------------------------------------------------------------

drop policy if exists public_read_published_notices
on public.notices;

create policy public_read_published_notices
on public.notices
for select
to anon, authenticated
using (
  status = 'PUBLISHED'::notice_status
);


-- ------------------------------------------------------------
-- 5. Authorized notice users may read notices
-- ------------------------------------------------------------

drop policy if exists authorized_users_read_notices
on public.notices;

create policy authorized_users_read_notices
on public.notices
for select
to authenticated
using (
  current_user_has_permission(
    'notice.create'::text,
    division_id
  )
  or
  current_user_has_permission(
    'notice.edit'::text,
    division_id
  )
  or
  current_user_has_permission(
    'notice.publish'::text,
    division_id
  )
  or
  current_user_has_permission(
    'notice.archive'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- 6. Create notices
-- ------------------------------------------------------------

drop policy if exists authorized_users_create_notices
on public.notices;

create policy authorized_users_create_notices
on public.notices
for insert
to authenticated
with check (
  created_by = auth.uid()
  and current_user_has_permission(
    'notice.create'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- 7. Notice UPDATE foundation
--
-- IMPORTANT:
-- Lifecycle status changes are intentionally NOT authorized
-- through a generic UPDATE policy here.
--
-- Status transitions will be performed by dedicated server-side
-- actions/database functions:
--
-- DRAFT    -> REVIEW
-- REVIEW   -> PUBLISHED
-- PUBLISHED -> ARCHIVED
--
-- This prevents a user with notice.edit from arbitrarily
-- changing the lifecycle status.
-- ------------------------------------------------------------

drop policy if exists authorized_users_update_notices
on public.notices;

drop policy if exists authorized_users_publish_notices
on public.notices;

drop policy if exists authorized_users_archive_notices
on public.notices;


-- ------------------------------------------------------------
-- 8. Protect notice audit-log creation
-- ------------------------------------------------------------

alter table public.audit_logs
enable row level security;

drop policy if exists authorized_users_write_notice_audit
on public.audit_logs;

create policy authorized_users_write_notice_audit
on public.audit_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and entity_type = 'notice'
  and (
    (
      action = 'CREATE'
      and current_user_has_permission(
        'notice.create'::text,
        division_id
      )
    )
    or
    (
      action = 'UPDATE'
      and current_user_has_permission(
        'notice.edit'::text,
        division_id
      )
    )
    or
    (
      action = 'PUBLISH'
      and current_user_has_permission(
        'notice.publish'::text,
        division_id
      )
    )
    or
    (
      action = 'ARCHIVE'
      and current_user_has_permission(
        'notice.archive'::text,
        division_id
      )
    )
  )
);


-- ------------------------------------------------------------
-- 9. Notice indexes
-- ------------------------------------------------------------

create index if not exists notices_division_status_idx
on public.notices (
  division_id,
  status
);

create index if not exists notices_division_published_at_idx
on public.notices (
  division_id,
  published_at desc
);

create index if not exists notices_session_idx
on public.notices (
  session_id
);

create index if not exists notices_category_idx
on public.notices (
  division_id,
  category
);


-- ------------------------------------------------------------
-- 10. Prevent duplicate slugs within a division
-- ------------------------------------------------------------

create unique index if not exists notices_division_slug_unique_idx
on public.notices (
  division_id,
  slug
);