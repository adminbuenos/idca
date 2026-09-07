-- Employee audit authorization
-- CREATE, UPDATE and DISABLE actions require the corresponding
-- employee permission.

alter table public.audit_logs enable row level security;

drop policy if exists authorized_users_create_employee_audit
on public.audit_logs;

drop policy if exists authorized_users_write_employee_audit
on public.audit_logs;

create policy authorized_users_write_employee_audit
on public.audit_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    (
      action = 'CREATE'
      and current_user_has_permission(
        'employee.create'::text,
        division_id
      )
    )
    or
    (
      action = 'UPDATE'
      and current_user_has_permission(
        'employee.edit'::text,
        division_id
      )
    )
    or
    (
      action = 'DISABLE'
      and current_user_has_permission(
        'employee.disable'::text,
        division_id
      )
    )
  )
);