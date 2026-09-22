-- ============================================================
-- Club Session Registration RLS - Final
-- ============================================================

alter table public.club_session_registrations
enable row level security;


-- ------------------------------------------------------------
-- INSERT
-- ------------------------------------------------------------

drop policy if exists
  "club_session_registrations_insert_authorized"
on public.club_session_registrations;

create policy
  "club_session_registrations_insert_authorized"
on public.club_session_registrations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.clubs c
    join public.user_roles ur
      on ur.user_id = auth.uid()
    join public.organizations target_org
      on target_org.id = c.division_id
    join public.roles r
      on r.id = ur.role_id
    where c.id = club_session_registrations.club_id
      and r.name in ('SUPER_ADMIN', 'ADMIN')
      and (
        ur.division_id = c.division_id
        or ur.division_id = target_org.parent_organization_id
      )
  )
);


-- ------------------------------------------------------------
-- UPDATE
-- ------------------------------------------------------------

drop policy if exists
  "club_session_registrations_update_authorized"
on public.club_session_registrations;

create policy
  "club_session_registrations_update_authorized"
on public.club_session_registrations
for update
to authenticated
using (
  exists (
    select 1
    from public.clubs c
    join public.user_roles ur
      on ur.user_id = auth.uid()
    join public.organizations target_org
      on target_org.id = c.division_id
    join public.roles r
      on r.id = ur.role_id
    where c.id = club_session_registrations.club_id
      and r.name in ('SUPER_ADMIN', 'ADMIN')
      and (
        ur.division_id = c.division_id
        or ur.division_id = target_org.parent_organization_id
      )
  )
)
with check (
  exists (
    select 1
    from public.clubs c
    join public.user_roles ur
      on ur.user_id = auth.uid()
    join public.organizations target_org
      on target_org.id = c.division_id
    join public.roles r
      on r.id = ur.role_id
    where c.id = club_session_registrations.club_id
      and (
        r.name = 'SUPER_ADMIN'
        or (
          r.name = 'ADMIN'
          and (
            ur.division_id = c.division_id
            or ur.division_id = target_org.parent_organization_id
          )
        )
      )
  )
);