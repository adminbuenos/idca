/*
 * ==========================================================
 * IDCA - League Draw Generation
 * Migration: 202609200002_league_draw_generation.sql
 * ==========================================================
 *
 * Generates a complete LEAGUE tournament draw atomically.
 *
 * Preconditions:
 *   - Tournament exists
 *   - Tournament is DRAW_PENDING
 *   - Participants have been finalized/locked
 *   - At least 2 ACTIVE tournament teams exist
 *   - User has tournament.draw permission
 *
 * Generated objects:
 *
 *   tournament_draws
 *        |
 *        +-- draw_participants
 *        |
 *        +-- tournament_groups
 *                 |
 *                 +-- group_teams
 *        |
 *        +-- draw_results
 *
 * Randomization:
 *   - Deterministic from random_seed
 *   - Seed is stored on tournament_draws
 *   - Same seed + same participants = same ordering
 *
 * Current supported format:
 *   LEAGUE
 *
 * ==========================================================
 */


/*
 * ==========================================================
 * FUNCTION
 * ==========================================================
 */

create or replace function public.generate_league_draw(
  p_tournament_id uuid,
  p_group_count integer default 1,
  p_random_seed text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$

declare
  v_user_id uuid;

  v_tournament public.tournaments%rowtype;

  v_draw_id uuid;
  v_group_id uuid;

  v_seed text;

  v_participant_count integer;
  v_group_count integer;

  v_group_number integer;
  v_group_position integer;
  v_index integer;

  v_team_ids uuid[];
  v_group_ids uuid[];

  v_team record;
  v_opponent record;

begin

  /*
   * --------------------------------------------------------
   * 1. AUTHENTICATION
   * --------------------------------------------------------
   */

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication is required to generate a tournament draw.';
  end if;


  /*
   * --------------------------------------------------------
   * 2. LOAD TOURNAMENT
   * --------------------------------------------------------
   */

  select *
  into v_tournament
  from public.tournaments
  where id = p_tournament_id;

  if not found then
    raise exception
      'Tournament % was not found.',
      p_tournament_id;
  end if;


  /*
   * --------------------------------------------------------
   * 3. AUTHORIZATION
   * --------------------------------------------------------
   *
   * The permission is evaluated against the tournament's
   * actual division.
   *
   * This allows the existing hierarchical authorization
   * model to remain the security boundary.
   * --------------------------------------------------------
   */

  if not public.current_user_has_permission(
    'tournament.draw',
    v_tournament.division_id
  ) then

    raise exception
      'You do not have permission to generate tournament draws.';

  end if;


  /*
   * --------------------------------------------------------
   * 4. TOURNAMENT STATE VALIDATION
   * --------------------------------------------------------
   */

  if v_tournament.status <> 'DRAW_PENDING' then

    raise exception
      'Tournament must be in DRAW_PENDING status before a draw can be generated. Current status: %.',
      v_tournament.status;

  end if;


  if v_tournament.participants_locked_at is null then

    raise exception
      'Tournament participants must be finalized before generating a draw.';

  end if;


  /*
   * --------------------------------------------------------
   * 5. FORMAT VALIDATION
   * --------------------------------------------------------
   */

  if v_tournament.format <> 'LEAGUE' then

    raise exception
      'This generator supports LEAGUE tournaments only.';

  end if;


  /*
   * --------------------------------------------------------
   * 6. GROUP COUNT VALIDATION
   * --------------------------------------------------------
   */

  v_group_count := coalesce(
    p_group_count,
    1
  );

  if v_group_count < 1 then

    raise exception
      'Group count must be at least 1.';

  end if;


  /*
   * --------------------------------------------------------
   * 7. COUNT ACTIVE PARTICIPANTS
   * --------------------------------------------------------
   */

  select count(*)
  into v_participant_count
  from public.tournament_teams
  where tournament_id = p_tournament_id
    and registration_status = 'ACTIVE';

  if v_participant_count < 2 then

    raise exception
      'At least 2 active participants are required to generate a league draw.';

  end if;


  if v_group_count > v_participant_count then

    raise exception
      'Group count (%) cannot exceed participant count (%).',
      v_group_count,
      v_participant_count;

  end if;


  /*
   * --------------------------------------------------------
   * 8. PREVENT DUPLICATE GENERATED DRAWS
   * --------------------------------------------------------
   *
   * A tournament may not accidentally receive another
   * generated draw.
   *
   * DRAFT draws are intentionally ignored here because
   * they can represent an unfinished configuration.
   * --------------------------------------------------------
   */

  if exists (
    select 1
    from public.tournament_draws
    where tournament_id = p_tournament_id
      and status in (
        'GENERATED',
        'REVIEWED',
        'PUBLISHED',
        'LOCKED'
      )
  ) then

    raise exception
      'A generated draw already exists for this tournament.';

  end if;


  /*
   * --------------------------------------------------------
   * 9. CREATE / NORMALIZE RANDOM SEED
   * --------------------------------------------------------
   */

  v_seed := coalesce(
    nullif(trim(p_random_seed), ''),
    encode(gen_random_bytes(16), 'hex')
  );


  /*
   * --------------------------------------------------------
   * 10. CREATE DRAW HEADER
   * --------------------------------------------------------
   */

  insert into public.tournament_draws (
    tournament_id,
    draw_type,
    status,
    random_seed,
    configuration,
    created_by
  )
  values (
    p_tournament_id,
    'GROUP_ASSIGNMENT',
    'GENERATED',
    v_seed,
    jsonb_build_object(
      'format', 'LEAGUE',
      'group_count', v_group_count,
      'participant_count', v_participant_count,
      'algorithm', 'deterministic_hash_shuffle',
      'algorithm_version', 1
    ),
    v_user_id
  )
  returning id
  into v_draw_id;


  /*
   * --------------------------------------------------------
   * 11. BUILD DETERMINISTIC TEAM ORDER
   * --------------------------------------------------------
   *
   * md5(seed + team id)
   *
   * PostgreSQL's md5() is deterministic, which means the
   * generated order can be reproduced from the stored seed.
   * --------------------------------------------------------
   */

  select array_agg(
    tt.id
    order by md5(
      v_seed || ':' || tt.id::text
    )
  )
  into v_team_ids
  from public.tournament_teams tt
  where tt.tournament_id = p_tournament_id
    and tt.registration_status = 'ACTIVE';


  /*
   * --------------------------------------------------------
   * 12. RECORD DRAW PARTICIPANTS
   * --------------------------------------------------------
   */

  insert into public.draw_participants (
    draw_id,
    tournament_team_id,
    input_position
  )
  select
    v_draw_id,
    tt.id,
    row_number() over (
      order by md5(
        v_seed || ':' || tt.id::text
      )
    )::integer
  from public.tournament_teams tt
  where tt.tournament_id = p_tournament_id
    and tt.registration_status = 'ACTIVE';


  /*
   * --------------------------------------------------------
   * 13. CREATE GROUPS
   * --------------------------------------------------------
   *
   * Examples:
   *
   *   1 group  -> Group A
   *   2 groups -> Group A, Group B
   *   4 groups -> Group A, Group B, Group C, Group D
   *
   * The UI currently limits group selection to 16.
   * This database function does not impose that UI limit.
   * --------------------------------------------------------
   */

  v_group_ids := array[]::uuid[];

  for v_group_number in 1..v_group_count loop

    insert into public.tournament_groups (
      tournament_id,
      name,
      display_order,
      status
    )
    values (
      p_tournament_id,
      'Group ' ||
        chr(
          ascii('A') +
          v_group_number -
          1
        ),
      v_group_number,
      'ACTIVE'
    )
    returning id
    into v_group_id;

    v_group_ids := array_append(
      v_group_ids,
      v_group_id
    );

  end loop;


  /*
   * --------------------------------------------------------
   * 14. ASSIGN TEAMS TO GROUPS
   * --------------------------------------------------------
   *
   * Teams are distributed in deterministic round-robin
   * order across groups.
   *
   * Example with 8 teams / 2 groups:
   *
   *   Team 1 -> A
   *   Team 2 -> B
   *   Team 3 -> A
   *   Team 4 -> B
   *   ...
   *
   * This keeps group sizes balanced.
   * --------------------------------------------------------
   */

  for v_index in 1..array_length(
    v_team_ids,
    1
  ) loop

    v_group_number :=
      ((v_index - 1) % v_group_count) + 1;

    v_group_position :=
      floor(
        (v_index - 1) / v_group_count
      )::integer + 1;

    insert into public.group_teams (
      group_id,
      tournament_team_id,
      position
    )
    values (
      v_group_ids[v_group_number],
      v_team_ids[v_index],
      v_group_position
    );

  end loop;


  /*
   * --------------------------------------------------------
   * 15. GENERATE ROUND-ROBIN PAIRINGS
   * --------------------------------------------------------
   *
   * Every team plays every other team in its group.
   *
   * For:
   *
   *   A vs B
   *
   * only one draw_results row is created:
   *
   *   A -> B
   *
   * We intentionally do NOT create:
   *
   *   B -> A
   *
   * because draw_results represents a pairing rather than
   * two directional relationships.
   *
   * Fixtures can later use these pairings to create the
   * actual match schedule.
   * --------------------------------------------------------
   */

  for v_group_number in 1..array_length(
    v_group_ids,
    1
  ) loop

    for v_team in
      select
        gt.tournament_team_id,
        gt.position
      from public.group_teams gt
      where gt.group_id =
        v_group_ids[v_group_number]
      order by gt.position
    loop

      for v_opponent in
        select
          gt2.tournament_team_id,
          gt2.position
        from public.group_teams gt2
        where gt2.group_id =
          v_group_ids[v_group_number]
          and gt2.position >
            v_team.position
        order by gt2.position
      loop

        insert into public.draw_results (
          draw_id,
          tournament_team_id,
          group_id,
          opponent_team_id,
          position,
          round,
          match_slot
        )
        values (
          v_draw_id,
          v_team.tournament_team_id,
          v_group_ids[v_group_number],
          v_opponent.tournament_team_id,
          v_team.position,
          1,
          null
        );

      end loop;

    end loop;

  end loop;


  /*
   * --------------------------------------------------------
   * 16. RETURN GENERATED DRAW ID
   * --------------------------------------------------------
   */

  return v_draw_id;

end;

$function$;


/*
 * ==========================================================
 * FUNCTION SECURITY
 * ==========================================================
 *
 * Only authenticated users can invoke the function.
 *
 * Authorization is still independently checked inside the
 * SECURITY DEFINER function using tournament.draw.
 * ==========================================================
 */

revoke all
on function public.generate_league_draw(
  uuid,
  integer,
  text
)
from public;

grant execute
on function public.generate_league_draw(
  uuid,
  integer,
  text
)
to authenticated;