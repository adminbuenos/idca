/*
 * ----------------------------------------------------------
 * Public Club Directory Read Security
 * ----------------------------------------------------------
 *
 * Public users may read only the active information required
 * to display the current IDCA club directory.
 *
 * No INSERT / UPDATE / DELETE policies are created here.
 * ----------------------------------------------------------
 */

-- ----------------------------------------------------------
-- Clubs
-- ----------------------------------------------------------

alter table public.clubs enable row level security;

drop policy if exists "clubs_public_read_active" on public.clubs;

create policy "clubs_public_read_active"
on public.clubs
for select
to anon, authenticated
using (
  division_id = '89304127-99c2-4427-8edd-87a9aff3e167'
  and status = 'ACTIVE'
);


-- ----------------------------------------------------------
-- Sessions
-- ----------------------------------------------------------

alter table public.sessions enable row level security;

drop policy if exists "sessions_public_read_active" on public.sessions;

create policy "sessions_public_read_active"
on public.sessions
for select
to anon, authenticated
using (
  division_id = '89304127-99c2-4427-8edd-87a9aff3e167'
  and status = 'ACTIVE'
);


-- ----------------------------------------------------------
-- Club Categories
-- ----------------------------------------------------------

alter table public.club_categories enable row level security;

drop policy if exists "club_categories_public_read_active"
on public.club_categories;

create policy "club_categories_public_read_active"
on public.club_categories
for select
to anon, authenticated
using (
  division_id = '89304127-99c2-4427-8edd-87a9aff3e167'
  and status = 'ACTIVE'
);


-- ----------------------------------------------------------
-- Club Session Registrations
-- ----------------------------------------------------------

alter table public.club_session_registrations enable row level security;

drop policy if exists
  "club_session_registrations_public_read_active"
on public.club_session_registrations;

create policy
  "club_session_registrations_public_read_active"
on public.club_session_registrations
for select
to anon, authenticated
using (
  registration_status = 'ACTIVE'
  and exists (
    select 1
    from public.clubs c
    where c.id = club_session_registrations.club_id
      and c.division_id =
        '89304127-99c2-4427-8edd-87a9aff3e167'
      and c.status = 'ACTIVE'
  )
);