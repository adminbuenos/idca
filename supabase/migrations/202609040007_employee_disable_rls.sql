-- Employee disable authorization

alter table public.employees enable row level security;

drop policy if exists authorized_users_disable_employees
on public.employees;

create policy authorized_users_disable_employees
on public.employees
for update
to authenticated
using (
  current_user_has_permission(
    'employee.disable'::text,
    division_id
  )
)
with check (
  current_user_has_permission(
    'employee.disable'::text,
    division_id
  )
);