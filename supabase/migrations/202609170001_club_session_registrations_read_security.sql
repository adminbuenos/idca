-- ============================================================
-- Club Session Registration Read Security
-- ============================================================

alter table public.club_session_registrations
enable row level security;


-- ------------------------------------------------------------
-- Admin users can read session registrations for clubs
-- in divisions they are authorized to manage.
-- ------------------------------------------------------------

drop policy if exists
"club_session_registrations_select_authorized"
on public.club_session_registrations;

create policy
"club_session_registrations_select_authorized"
on public.club_session_registrations
for select
to authenticated
using (
  exists (
    select 1
    from public.clubs c
    where c.id = club_session_registrations.club_id
      and public.current_user_has_permission(
        'club.edit',
        c.division_id
      )
  )
);