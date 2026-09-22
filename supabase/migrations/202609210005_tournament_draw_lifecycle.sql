/*
 * ============================================================
 * TOURNAMENT DRAW LIFECYCLE SECURITY
 * ============================================================
 *
 * Allowed lifecycle:
 *
 * GENERATED
 *     ↓
 * REVIEWED
 *     ↓
 * PUBLISHED
 *     ↓
 * LOCKED
 *
 * All transitions are enforced inside PostgreSQL.
 *
 * The application/UI must never be the security boundary.
 * ============================================================
 */

-- ------------------------------------------------------------
-- Ensure lifecycle audit columns exist.
-- ------------------------------------------------------------

alter table public.tournament_draws
  add column if not exists reviewed_by uuid null;

alter table public.tournament_draws
  add column if not exists reviewed_at timestamptz null;

alter table public.tournament_draws
  add column if not exists published_by uuid null;

alter table public.tournament_draws
  add column if not exists published_at timestamptz null;

alter table public.tournament_draws
  add column if not exists locked_at timestamptz null;


-- ------------------------------------------------------------
-- Foreign keys for lifecycle actors.
-- ------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournament_draws_reviewed_by_fkey'
  ) then

    alter table public.tournament_draws
      add constraint tournament_draws_reviewed_by_fkey
      foreign key (reviewed_by)
      references auth.users(id)
      on delete set null;

  end if;
end
$$;


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


-- ------------------------------------------------------------
-- Useful lifecycle indexes.
-- ------------------------------------------------------------

create index if not exists
  tournament_draws_reviewed_at_idx
on public.tournament_draws (reviewed_at);

create index if not exists
  tournament_draws_published_at_idx
on public.tournament_draws (published_at);

create index if not exists
  tournament_draws_locked_at_idx
on public.tournament_draws (locked_at);


-- ------------------------------------------------------------
-- Secure lifecycle transition function.
-- ------------------------------------------------------------

create or replace function public.transition_tournament_draw(
  p_draw_id uuid,
  p_target_status public.draw_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$

declare
  v_user_id uuid;
  v_draw public.tournament_draws%rowtype;
  v_tournament public.tournaments%rowtype;

  v_old_status public.draw_status;
  v_new_status public.draw_status;

  v_now timestamptz := now();

begin

  /*
   * ----------------------------------------------------------
   * Authentication
   * ----------------------------------------------------------
   */

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication is required to transition a tournament draw.';
  end if;


  /*
   * ----------------------------------------------------------
   * Validate input
   * ----------------------------------------------------------
   */

  if p_draw_id is null then
    raise exception
      'Tournament draw ID is required.';
  end if;

  if p_target_status is null then
    raise exception
      'Target draw status is required.';
  end if;


  /*
   * ----------------------------------------------------------
   * Load and lock draw row.
   *
   * FOR UPDATE prevents two administrators from attempting
   * lifecycle transitions simultaneously.
   * ----------------------------------------------------------
   */

  select *
  into v_draw
  from public.tournament_draws
  where id = p_draw_id
  for update;

  if not found then
    raise exception
      'Tournament draw not found.';
  end if;


  /*
   * ----------------------------------------------------------
   * Load tournament.
   * ----------------------------------------------------------
   */

  select *
  into v_tournament
  from public.tournaments
  where id = v_draw.tournament_id;

  if not found then
    raise exception
      'Tournament associated with this draw was not found.';
  end if;


  /*
   * ----------------------------------------------------------
   * Verify the draw belongs to IDCA.
   *
   * This keeps this migration aligned with the current IDCA
   * implementation.
   * ----------------------------------------------------------
   */

  if v_tournament.division_id <>
     '89304127-99c2-4427-8edd-87a9aff3e167'::uuid then

    raise exception
      'This tournament draw does not belong to IDCA.';

  end if;


  /*
   * ----------------------------------------------------------
   * Permission check.
   *
   * IMPORTANT:
   * current_user_has_permission() uses auth.uid(), so this
   * check is performed before any state transition.
   * ----------------------------------------------------------
   */

  if not public.current_user_has_permission(
    'tournament.draw',
    v_tournament.division_id
  ) then

    raise exception
      'You do not have permission to transition this tournament draw.';

  end if;


  /*
   * ----------------------------------------------------------
   * Capture current status.
   * ----------------------------------------------------------
   */

  v_old_status := v_draw.status;
  v_new_status := p_target_status;


  /*
   * ----------------------------------------------------------
   * Prevent no-op transitions.
   * ----------------------------------------------------------
   */

  if v_old_status = v_new_status then
    raise exception
      'Tournament draw is already in status %.',
      v_old_status;
  end if;


  /*
   * ----------------------------------------------------------
   * Enforce lifecycle.
   *
   * GENERATED → REVIEWED
   * REVIEWED  → PUBLISHED
   * PUBLISHED → LOCKED
   * ----------------------------------------------------------
   */

  if v_old_status = 'GENERATED'
     and v_new_status = 'REVIEWED' then

    update public.tournament_draws
    set
      status = 'REVIEWED',
      reviewed_by = v_user_id,
      reviewed_at = v_now
    where id = v_draw.id;

  elsif v_old_status = 'REVIEWED'
        and v_new_status = 'PUBLISHED' then

    update public.tournament_draws
    set
      status = 'PUBLISHED',
      published_by = v_user_id,
      published_at = v_now
    where id = v_draw.id;

  elsif v_old_status = 'PUBLISHED'
        and v_new_status = 'LOCKED' then

    update public.tournament_draws
    set
      status = 'LOCKED',
      locked_at = v_now
    where id = v_draw.id;

  else

    raise exception
      'Invalid tournament draw transition: % → %.',
      v_old_status,
      v_new_status;

  end if;


  /*
   * ----------------------------------------------------------
   * Audit successful transition.
   * ----------------------------------------------------------
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
    v_tournament.division_id,
    v_user_id,
    'UPDATE',
    'TOURNAMENT_DRAW',
    v_draw.id,

    jsonb_build_object(
      'status', v_old_status
    ),

    jsonb_build_object(
      'status', v_new_status
    ),

    jsonb_build_object(
      'action', 'DRAW_STATUS_TRANSITION',
      'tournament_id', v_tournament.id,
      'tournament_name', v_tournament.name,
      'from_status', v_old_status,
      'to_status', v_new_status
    )
  );


  return v_draw.id;

end;
$function$;


-- ------------------------------------------------------------
-- Restrict function execution.
-- ------------------------------------------------------------

revoke all
on function public.transition_tournament_draw(
  uuid,
  public.draw_status
)
from public;


grant execute
on function public.transition_tournament_draw(
  uuid,
  public.draw_status
)
to authenticated;