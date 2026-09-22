/*
 * ----------------------------------------------------------
 * Tournament Participant Lock
 * ----------------------------------------------------------
 *
 * Once tournament participants are finalized, the participant
 * list becomes immutable and the tournament moves to
 * DRAW_PENDING.
 *
 * This protects the integrity of subsequently generated
 * tournament draws.
 * ----------------------------------------------------------
 */

alter table public.tournaments
add column if not exists participants_locked_at timestamptz null;

alter table public.tournaments
add column if not exists participants_locked_by uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_participants_locked_by_fkey'
  ) then
    alter table public.tournaments
    add constraint tournaments_participants_locked_by_fkey
      foreign key (participants_locked_by)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

create index if not exists
  tournaments_participants_locked_at_idx
on public.tournaments (participants_locked_at);