/*
 * ----------------------------------------------------------
 * Tournament Teams Read Security
 * ----------------------------------------------------------
 *
 * Public users can read tournament teams only when the
 * tournament has progressed beyond DRAFT.
 *
 * Authorized tournament managers/admins must also be able
 * to read tournament participants while the tournament is
 * still in DRAFT so they can manage the participant list.
 * ----------------------------------------------------------
 */

drop policy if exists
  "admin_read_tournament_teams"
on public.tournament_teams;

create policy
  "admin_read_tournament_teams"
on public.tournament_teams
for select
to authenticated
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_teams.tournament_id
      and public.current_user_has_permission(
        'tournament.edit',
        t.division_id
      )
  )
);