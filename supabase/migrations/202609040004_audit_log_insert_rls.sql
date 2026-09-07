-- Allow authorized users to create audit records for employee creation.
-- Audit records are tied to the authenticated user and target division.

alter table public.audit_logs enable row level security;

drop policy if exists authorized_users_create_employee_audit
on public.audit_logs;

create policy authorized_users_create_employee_audit
on public.audit_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and current_user_has_permission(
    'employee.create'::text,
    division_id
  )
);