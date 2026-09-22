-- ============================================================
-- IDCA Tournament Foundation
-- Migration: 202609140001_tournament_foundation.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add club category to tournaments
-- ------------------------------------------------------------

alter table public.tournaments
add column if not exists club_category_id uuid;

alter table public.tournaments
drop constraint if exists tournaments_club_category_id_fkey;

alter table public.tournaments
add constraint tournaments_club_category_id_fkey
foreign key (club_category_id)
references public.club_categories(id);


-- ------------------------------------------------------------
-- 2. Ensure U-22 age category exists for IDCA
-- ------------------------------------------------------------

insert into public.age_categories (
  division_id,
  name,
  code,
  maximum_age,
  display_order,
  status
)
select
  '89304127-99c2-4427-8edd-87a9aff3e167'::uuid,
  'Under-22',
  'U22',
  22,
  4,
  'ACTIVE'::record_status
where not exists (
  select 1
  from public.age_categories
  where division_id = '89304127-99c2-4427-8edd-87a9aff3e167'::uuid
    and code = 'U22'
);


-- ------------------------------------------------------------
-- 3. Protect category codes from duplicates
-- ------------------------------------------------------------

create unique index if not exists
club_categories_division_code_unique
on public.club_categories (
  division_id,
  code
);

create unique index if not exists
age_categories_division_code_unique
on public.age_categories (
  division_id,
  code
);

create unique index if not exists
tournaments_division_slug_unique
on public.tournaments (
  division_id,
  slug
);


-- ------------------------------------------------------------
-- 4. Tournament category validation
--
-- A Grade / A Elite:
--   Age category is required.
--
-- B Grade:
--   Age category must be NULL.
-- ------------------------------------------------------------

create or replace function public.validate_tournament_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$

declare
  category_code text;
  age_code text;
begin

  select cc.code
  into category_code
  from public.club_categories cc
  where cc.id = new.club_category_id
    and cc.division_id = new.division_id;

  if category_code is null then
    raise exception 'Invalid club category for this division';
  end if;


  if category_code = 'B_GRADE' then

    if new.age_category_id is not null then
      raise exception
        'B Grade tournaments cannot have an age category';
    end if;

  elsif category_code in ('A_GRADE', 'A_ELITE') then

    if new.age_category_id is null then
      raise exception
        'A Grade and A Elite tournaments require an age category';
    end if;

    select ac.code
    into age_code
    from public.age_categories ac
    where ac.id = new.age_category_id
      and ac.division_id = new.division_id;

    if age_code is null then
      raise exception
        'Invalid age category for this division';
    end if;

  else

    raise exception
      'Unsupported club category for tournament';

  end if;

  return new;

end;

$function$;


drop trigger if exists validate_tournament_category_trigger
on public.tournaments;

create trigger validate_tournament_category_trigger
before insert or update of
  division_id,
  club_category_id,
  age_category_id
on public.tournaments
for each row
execute function public.validate_tournament_category();


-- ------------------------------------------------------------
-- 5. Tournament permissions
-- ------------------------------------------------------------

insert into public.permissions (
  code,
  name,
  description,
  module
)
values
(
  'tournament.create',
  'Create Tournament',
  'Create a new tournament.',
  'tournaments'
),
(
  'tournament.edit',
  'Edit Tournament',
  'Edit tournament details before competition begins.',
  'tournaments'
),
(
  'tournament.draw',
  'Manage Tournament Draw',
  'Create, generate, review, publish and lock tournament draws.',
  'tournaments'
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module;


-- ------------------------------------------------------------
-- 6. Role permissions
-- ------------------------------------------------------------

-- ADMIN gets all tournament permissions.
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'ADMIN'
  and p.code in (
    'tournament.create',
    'tournament.edit',
    'tournament.draw'
  )
on conflict do nothing;


-- SUPER_ADMIN gets all tournament permissions.
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'SUPER_ADMIN'
  and p.code in (
    'tournament.create',
    'tournament.edit',
    'tournament.draw'
  )
on conflict do nothing;


-- TOURNAMENT_MANAGER gets all tournament permissions.
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'TOURNAMENT_MANAGER'
  and p.code in (
    'tournament.create',
    'tournament.edit',
    'tournament.draw'
  )
on conflict do nothing;


-- ------------------------------------------------------------
-- 7. Tournament table RLS
-- ------------------------------------------------------------

alter table public.tournaments
enable row level security;


-- Authorized tournament users can read tournaments.
drop policy if exists authorized_users_read_tournaments
on public.tournaments;

create policy authorized_users_read_tournaments
on public.tournaments
for select
to authenticated
using (
  current_user_has_permission(
    'tournament.create'::text,
    division_id
  )
  or
  current_user_has_permission(
    'tournament.edit'::text,
    division_id
  )
  or
  current_user_has_permission(
    'tournament.draw'::text,
    division_id
  )
);


-- Authorized users can create tournaments.
drop policy if exists authorized_users_create_tournaments
on public.tournaments;

create policy authorized_users_create_tournaments
on public.tournaments
for insert
to authenticated
with check (
  created_by = auth.uid()
  and current_user_has_permission(
    'tournament.create'::text,
    division_id
  )
);


-- Authorized users can edit tournaments.
drop policy if exists authorized_users_update_tournaments
on public.tournaments;

create policy authorized_users_update_tournaments
on public.tournaments
for update
to authenticated
using (
  current_user_has_permission(
    'tournament.edit'::text,
    division_id
  )
)
with check (
  current_user_has_permission(
    'tournament.edit'::text,
    division_id
  )
);


-- ------------------------------------------------------------
-- 8. Indexes
-- ------------------------------------------------------------

create index if not exists
tournaments_division_id_idx
on public.tournaments (division_id);

create index if not exists
tournaments_session_id_idx
on public.tournaments (session_id);

create index if not exists
tournaments_club_category_id_idx
on public.tournaments (club_category_id);

create index if not exists
tournaments_age_category_id_idx
on public.tournaments (age_category_id);

create index if not exists
tournaments_status_idx
on public.tournaments (status);