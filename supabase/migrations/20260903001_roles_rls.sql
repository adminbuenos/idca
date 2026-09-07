-- Roles are reference data required for authorization checks.
-- Authenticated users may read role definitions.

alter table public.roles enable row level security;

drop policy if exists authenticated_read_roles
on public.roles;

create policy authenticated_read_roles
on public.roles
for select
to authenticated
using (true);