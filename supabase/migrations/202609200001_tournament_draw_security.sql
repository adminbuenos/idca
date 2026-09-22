/*
 * ----------------------------------------------------------
 * Tournament Draw Security Foundation
 * ----------------------------------------------------------
 *
 * Draws are managed only by users who have tournament.draw
 * permission for the tournament's division.
 *
 * Public users receive read access only through the existing
 * public policies on published/scheduled tournament data.
 *
 * The draw hierarchy is:
 *
 * tournament_draws
 *      ├── draw_participants
 *      ├── draw_results
 *      └── tournament_groups
 *               └── group_teams
 *
 * All child records are therefore authorized through their
 * parent tournament/draw.
 * ----------------------------------------------------------
 */


/*
 * ----------------------------------------------------------
 * DRAW PARTICIPANTS
 * ----------------------------------------------------------
 */

drop policy if exists
  "authorized_users_manage_draw_participants"
on public.draw_participants;

create policy
  "authorized_users_manage_draw_participants"
on public.draw_participants
for all
to authenticated
using (
  exists (
    select 1
    from public.tournament_draws td
    join public.tournaments t
      on t.id = td.tournament_id
    where td.id = draw_participants.draw_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
)
with check (
  exists (
    select 1
    from public.tournament_draws td
    join public.tournaments t
      on t.id = td.tournament_id
    where td.id = draw_participants.draw_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
);


/*
 * ----------------------------------------------------------
 * DRAW RESULTS
 * ----------------------------------------------------------
 */

drop policy if exists
  "authorized_users_manage_draw_results"
on public.draw_results;

create policy
  "authorized_users_manage_draw_results"
on public.draw_results
for all
to authenticated
using (
  exists (
    select 1
    from public.tournament_draws td
    join public.tournaments t
      on t.id = td.tournament_id
    where td.id = draw_results.draw_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
)
with check (
  exists (
    select 1
    from public.tournament_draws td
    join public.tournaments t
      on t.id = td.tournament_id
    where td.id = draw_results.draw_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
);


/*
 * ----------------------------------------------------------
 * TOURNAMENT GROUPS
 * ----------------------------------------------------------
 */

drop policy if exists
  "authorized_users_manage_tournament_groups"
on public.tournament_groups;

create policy
  "authorized_users_manage_tournament_groups"
on public.tournament_groups
for all
to authenticated
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_groups.tournament_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
)
with check (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_groups.tournament_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
);


/*
 * ----------------------------------------------------------
 * GROUP TEAMS
 * ----------------------------------------------------------
 */

drop policy if exists
  "authorized_users_manage_group_teams"
on public.group_teams;

create policy
  "authorized_users_manage_group_teams"
on public.group_teams
for all
to authenticated
using (
  exists (
    select 1
    from public.tournament_groups tg
    join public.tournaments t
      on t.id = tg.tournament_id
    where tg.id = group_teams.group_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
)
with check (
  exists (
    select 1
    from public.tournament_groups tg
    join public.tournaments t
      on t.id = tg.tournament_id
    where tg.id = group_teams.group_id
      and public.current_user_has_permission(
        'tournament.draw',
        t.division_id
      )
  )
);