-- ============================================================
-- Club Session Registration Security Fix
-- ============================================================
-- Purpose:
-- Resolve the club's division through a SECURITY DEFINER
-- function so registration RLS does not depend on the
-- caller's ability to SELECT the parent club row.
-- ============================================================


-- ------------------------------------------------------------
-- Helper: determine whether the current user can edit a
-- registration belonging to a particular club.
-- ------------------------------------------------------------

create or replace function public.current_user_can_edit_club_registration(
  p_club_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.clubs c
    where c.id = p_club_id
      and public.current_user_has_permission(
        'club.edit',
        c.division_id
      )
  );
$function$;


-- ------------------------------------------------------------
-- Lock down function execution.
-- ------------------------------------------------------------

revoke all
on function public.current_user_can_edit_club_registration(uuid)
from public;

grant execute
on function public.current_user_can_edit_club_registration(uuid)
to authenticated;


-- ------------------------------------------------------------
-- Ensure RLS is enabled.
-- ------------------------------------------------------------

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
  public.current_user_can_edit_club_registration(
    club_id
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
  public.current_user_can_edit_club_registration(
    club_id
  )
)
with check (
  public.current_user_can_edit_club_registration(
    club_id
  )
);