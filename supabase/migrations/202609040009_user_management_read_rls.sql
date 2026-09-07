-- ============================================================
-- User Management Read RLS
-- Allows authorized administrators to view employee
-- login profiles and assigned roles.
-- ============================================================

alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;


-- ------------------------------------------------------------
-- USER PROFILES
-- ------------------------------------------------------------

drop policy if exists users_read_own_profile
on public.user_profiles;

drop policy if exists authorized_users_read_managed_profiles
on public.user_profiles;

create policy authorized_users_read_managed_profiles
on public.user_profiles
for select
to authenticated
using (
  current_user_has_permission(
    'system.manage_users'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- USER ROLES
-- ------------------------------------------------------------

drop policy if exists users_read_own_user_roles
on public.user_roles;

drop policy if exists authorized_users_read_managed_roles
on public.user_roles;

create policy authorized_users_read_managed_roles
on public.user_roles
for select
to authenticated
using (
  current_user_has_permission(
    'system.manage_users'::text,
    division_id
  )
  or
  current_user_has_permission(
    'system.manage_roles'::text,
    division_id
  )
);