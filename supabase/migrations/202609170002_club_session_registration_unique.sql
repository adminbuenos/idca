-- ============================================================
-- Club Session Registration Uniqueness
-- ============================================================
-- A club can have only one registration record per session.
-- RLS remains enabled; this is a data-integrity constraint.
-- ============================================================

create unique index if not exists
  club_session_registrations_club_session_unique
on public.club_session_registrations (
  club_id,
  session_id
);