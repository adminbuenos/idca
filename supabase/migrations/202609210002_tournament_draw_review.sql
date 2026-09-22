/*
  Tournament draw review lifecycle

  GENERATED -> REVIEWED

  This migration:
  - records who reviewed a draw
  - records when it was reviewed
  - provides a database-enforced transition
  - checks tournament.draw permission
  - prevents invalid lifecycle transitions
  - records an audit entry
*/

alter table public.tournament_draws
add column if not exists reviewed_at timestamptz null;

alter table public.tournament_draws
add column if not exists reviewed_by uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournament_draws_reviewed_by_fkey'
  ) then
    alter table public.tournament_draws
    add constraint tournaments_draws_reviewed_by_fkey
      foreign key (reviewed_by)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

create index if not exists tournament_draws_reviewed_at_idx
on public.tournament_draws (reviewed_at);

create or replace function public.review_tournament_draw(
  p_draw_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_draw public.tournament_draws%rowtype;
  v_tournament_division_id uuid;
begin
  /*
    Authenticated user is required.
  */
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  /*
    Load the draw itself.
  */
  select td.*
  into v_draw
  from public.tournament_draws td
  where td.id = p_draw_id;

  if not found then
    raise exception 'Tournament draw was not found.';
  end if;

  /*
    Load the tournament's division separately.
  */
  select t.division_id
  into v_tournament_division_id
  from public.tournaments t
  where t.id = v_draw.tournament_id;

  if v_tournament_division_id is null then
    raise exception 'Tournament division could not be determined.';
  end if;

  /*
    Authorization is evaluated against the tournament's
    actual division.
  */
  if not public.current_user_has_permission(
    'tournament.draw',
    v_tournament_division_id
  ) then
    raise exception
      'You do not have permission to review tournament draws.';
  end if;

  /*
    Only a GENERATED draw may be reviewed.
  */
  if v_draw.status <> 'GENERATED' then
    raise exception
      'Only a GENERATED draw can be reviewed. Current status: %',
      v_draw.status;
  end if;

  /*
    Transition the draw.

    The status condition is repeated here so that two
    concurrent review requests cannot both succeed.
  */
  update public.tournament_draws
  set
    status = 'REVIEWED',
    reviewed_at = now(),
    reviewed_by = v_user_id
  where id = p_draw_id
    and status = 'GENERATED';

  if not found then
    raise exception
      'The draw could not be reviewed because its status changed.';
  end if;

  /*
    Audit the successful transition.
  */
  insert into public.audit_logs (
    division_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    metadata
  )
  values (
    v_tournament_division_id,
    v_user_id,
    'UPDATE',
    'TOURNAMENT_DRAW',
    p_draw_id,
    jsonb_build_object(
      'status', 'GENERATED'
    ),
    jsonb_build_object(
      'status', 'REVIEWED',
      'reviewed_by', v_user_id,
      'reviewed_at', now()
    ),
    jsonb_build_object(
      'event', 'TOURNAMENT_DRAW_REVIEWED',
      'tournament_id', v_draw.tournament_id,
      'draw_id', p_draw_id
    )
  );
end;
$function$;

revoke all
on function public.review_tournament_draw(uuid)
from public;

grant execute
on function public.review_tournament_draw(uuid)
to authenticated;