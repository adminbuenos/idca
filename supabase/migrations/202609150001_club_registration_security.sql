-- ============================================================
-- Club Session Registration Security
-- ============================================================

alter table public.club_session_registrations
enable row level security;


-- ------------------------------------------------------------
-- INSERT
-- Authorized users with club.edit permission can register
-- an active club for a session/category within their division.
-- ------------------------------------------------------------

drop policy if exists "club_session_registrations_insert_authorized"
on public.club_session_registrations;

create policy "club_session_registrations_insert_authorized"
on public.club_session_registrations
for insert
to authenticated
with check (
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


-- ------------------------------------------------------------
-- UPDATE
-- Allows authorized users to restore/deactivate/edit an
-- existing registration through the club's division.
-- ------------------------------------------------------------

drop policy if exists "club_session_registrations_update_authorized"
on public.club_session_registrations;

create policy "club_session_registrations_update_authorized"
on public.club_session_registrations
for update
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
)
with check (
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