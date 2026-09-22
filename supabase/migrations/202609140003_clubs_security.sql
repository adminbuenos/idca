-- ============================================================
-- Club Management Security
-- ============================================================

-- 1. Create club management permissions
insert into public.permissions (
  code,
  name,
  description,
  module
)
values
  (
    'club.create',
    'Create Clubs',
    'Create clubs within an authorized division.',
    'clubs'
  ),
  (
    'club.edit',
    'Edit Clubs',
    'Edit and manage clubs within an authorized division.',
    'clubs'
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module;


-- 2. Give club management permissions to ADMIN
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
  and p.code in ('club.create', 'club.edit')
on conflict do nothing;


-- 3. Give club management permissions to SUPER_ADMIN
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
  and p.code in ('club.create', 'club.edit')
on conflict do nothing;


-- 4. Enable RLS
alter table public.clubs enable row level security;


-- 5. Allow authorized users to create clubs
drop policy if exists "clubs_insert_authorized" on public.clubs;

create policy "clubs_insert_authorized"
on public.clubs
for insert
to authenticated
with check (
  public.current_user_has_permission(
    'club.create',
    division_id
  )
);


-- 6. Allow authorized users to edit clubs
drop policy if exists "clubs_update_authorized" on public.clubs;

create policy "clubs_update_authorized"
on public.clubs
for update
to authenticated
using (
  public.current_user_has_permission(
    'club.edit',
    division_id
  )
)
with check (
  public.current_user_has_permission(
    'club.edit',
    division_id
  )
);