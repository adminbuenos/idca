-- ============================================================
-- Tournament Settings Security
-- ============================================================

alter table public.tournament_settings enable row level security;


-- ------------------------------------------------------------
-- SELECT
-- ------------------------------------------------------------

drop policy if exists "tournament_settings_select" 
on public.tournament_settings;

create policy "tournament_settings_select"
on public.tournament_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_settings.tournament_id
      and public.current_user_has_permission(
        'tournament.edit',
        t.division_id
      )
  )
);


-- ------------------------------------------------------------
-- INSERT
-- ------------------------------------------------------------

drop policy if exists "tournament_settings_insert" 
on public.tournament_settings;

create policy "tournament_settings_insert"
on public.tournament_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_settings.tournament_id
      and public.current_user_has_permission(
        'tournament.edit',
        t.division_id
      )
  )
);


-- ------------------------------------------------------------
-- UPDATE
-- ------------------------------------------------------------

drop policy if exists "tournament_settings_update" 
on public.tournament_settings;

create policy "tournament_settings_update"
on public.tournament_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_settings.tournament_id
      and public.current_user_has_permission(
        'tournament.edit',
        t.division_id
      )
  )
)
with check (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_settings.tournament_id
      and public.current_user_has_permission(
        'tournament.edit',
        t.division_id
      )
  )
);


-- ------------------------------------------------------------
-- DELETE
-- ------------------------------------------------------------

drop policy if exists "tournament_settings_delete" 
on public.tournament_settings;

create policy "tournament_settings_delete"
on public.tournament_settings
for delete
to authenticated
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_settings.tournament_id
      and public.current_user_has_permission(
        'tournament.edit',
        t.division_id
      )
  )
);