/*
  Tournament draw publication lifecycle

  REVIEWED -> PUBLISHED

  This migration:
  - records who published the draw
  - records when it was published
  - provides a database-enforced transition
  - checks tournament.draw permission
  - prevents invalid lifecycle transitions
  - records an audit entry
*/

alter table public.tournament_draws
add column if not exists published_by uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournament_draws_published_by_fkey'
  ) then
    alter table public.tournament_draws
    add constraint tournament_draws_published_by_fkey
      foreign key (published_by)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

create index if not exists tournament_draws_published_at_idx
on public.tournament_draws (published_at);

create or replace function public.publish_tournament_draw(
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
    Load the draw.
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
      'You do not have permission to publish tournament draws.';
  end if;

  /*
    Only a REVIEWED draw may be published.
  */
  if v_draw.status <> 'REVIEWED' then
    raise exception
      'Only a REVIEWED draw can be published. Current status: %',
      v_draw.status;
  end if;

  /*
    The draw must have been reviewed.
  */
  if v_draw.reviewed_at is null
     or v_draw.reviewed_by is null then
    raise exception
      'The draw cannot be published because its review information is incomplete.';
  end if;

  /*
    Publish the draw.

    The status condition prevents two concurrent publication
    requests from both succeeding.
  */
  update public.tournament_draws
  set
    status = 'PUBLISHED',
    published_at = now(),
    published_by = v_user_id
  where id = p_draw_id
    and status = 'REVIEWED';

  if not found then
    raise exception
      'The draw could not be published because its status changed.';
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
      'status', 'REVIEWED'
    ),
    jsonb_build_object(
      'status', 'PUBLISHED',
      'published_by', v_user_id,
      'published_at', now()
    ),
    jsonb_build_object(
      'event', 'TOURNAMENT_DRAW_PUBLISHED',
      'tournament_id', v_draw.tournament_id,
      'draw_id', p_draw_id
    )
  );
end;
$function$;

revoke all
on function public.publish_tournament_draw(uuid)
from public;

grant execute
on function public.publish_tournament_draw(uuid)
to authenticated;