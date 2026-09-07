-- Employee update authorization

alter table public.people enable row level security;
alter table public.employees enable row level security;

drop policy if exists authorized_users_update_people
on public.people;

create policy authorized_users_update_people
on public.people
for update
to authenticated
using (
  current_user_has_permission(
    'employee.edit'::text,
    division_id
  )
)
with check (
  current_user_has_permission(
    'employee.edit'::text,
    division_id
  )
);

drop policy if exists authorized_users_update_employees
on public.employees;

create policy authorized_users_update_employees
on public.employees
for update
to authenticated
using (
  current_user_has_permission(
    'employee.edit'::text,
    division_id
  )
)
with check (
  current_user_has_permission(
    'employee.edit'::text,
    division_id
  )
);