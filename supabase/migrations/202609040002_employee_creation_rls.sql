-- Employee creation authorization
--
-- Employees are created as:
-- people -> employees
--
-- Only users with the employee.create permission for the
-- target division may create these records.

alter table public.people enable row level security;
alter table public.employees enable row level security;


-- PEOPLE: allow authorized employee creators to insert people
drop policy if exists authorized_users_create_people
on public.people;

create policy authorized_users_create_people
on public.people
for insert
to authenticated
with check (
  current_user_has_permission(
    'employee.create'::text,
    division_id
  )
);


-- EMPLOYEES: allow authorized employee creators to insert employees
drop policy if exists authorized_users_create_employees
on public.employees;

create policy authorized_users_create_employees
on public.employees
for insert
to authenticated
with check (
  current_user_has_permission(
    'employee.create'::text,
    division_id
  )
);