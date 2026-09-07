-- ============================================================
-- Employee Login Creation RLS
-- ============================================================

-- ------------------------------------------------------------
-- user_profiles
-- ------------------------------------------------------------

alter table public.user_profiles enable row level security;

drop policy if exists authorized_users_create_user_profiles
on public.user_profiles;

create policy authorized_users_create_user_profiles
on public.user_profiles
for insert
to authenticated
with check (
  current_user_has_permission(
    'system.manage_users'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- user_roles
-- ------------------------------------------------------------

alter table public.user_roles enable row level security;

drop policy if exists authorized_users_create_user_roles
on public.user_roles;

create policy authorized_users_create_user_roles
on public.user_roles
for insert
to authenticated
with check (
  current_user_has_permission(
    'system.manage_roles'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------

alter table public.audit_logs enable row level security;

drop policy if exists authorized_users_write_user_management_audit
on public.audit_logs;

create policy authorized_users_write_user_management_audit
on public.audit_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    (
      action = 'CREATE'
      and entity_type = 'user_profile'
      and current_user_has_permission(
        'system.manage_users'::text,
        division_id
      )
    )
    or
    (
      action = 'ASSIGN_ROLE'
      and entity_type = 'user_role'
      and current_user_has_permission(
        'system.manage_roles'::text,
        division_id
      )
    )
  )
);