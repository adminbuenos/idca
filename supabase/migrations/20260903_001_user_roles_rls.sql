-- Allow authenticated users to read their own role assignments.
-- This is required for server-side authorization checks.

alter table public.user_roles enable row level security;

drop policy if exists users_read_own_user_roles
on public.user_roles;

create policy users_read_own_user_roles
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
);