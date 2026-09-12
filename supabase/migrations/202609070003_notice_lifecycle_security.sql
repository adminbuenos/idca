-- ============================================================
-- IDCA Notice Lifecycle Security
-- Migration: 202609070003_notice_lifecycle_security.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Secure DRAFT -> REVIEW transition
-- ------------------------------------------------------------

create or replace function public.submit_notice_for_review(
  notice_id uuid
)
returns public.notices
language plpgsql
security definer
set search_path = public
as $function$

declare
  notice_record public.notices;
begin

  select *
  into notice_record
  from public.notices
  where id = notice_id;

  if not found then
    raise exception 'Notice not found';
  end if;

  if not public.current_user_has_permission(
    'notice.edit'::text,
    notice_record.division_id
  ) then
    raise exception 'You do not have permission to submit this notice for review';
  end if;

  if notice_record.status <> 'DRAFT'::notice_status then
    raise exception 'Only DRAFT notices can be submitted for review';
  end if;

  update public.notices
  set
    status = 'REVIEW'::notice_status,
    updated_by = auth.uid(),
    updated_at = now()
  where id = notice_id
  returning *
  into notice_record;

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
    notice_record.division_id,
    auth.uid(),
    'UPDATE',
    'notice',
    notice_record.id,
    jsonb_build_object(
      'status', 'DRAFT'
    ),
    jsonb_build_object(
      'status', 'REVIEW'
    ),
    jsonb_build_object(
      'transition', 'DRAFT_TO_REVIEW'
    )
  );

  return notice_record;

end;

$function$;


-- ------------------------------------------------------------
-- 2. Secure REVIEW -> PUBLISHED transition
-- ------------------------------------------------------------

create or replace function public.publish_notice(
  notice_id uuid
)
returns public.notices
language plpgsql
security definer
set search_path = public
as $function$

declare
  notice_record public.notices;
begin

  select *
  into notice_record
  from public.notices
  where id = notice_id;

  if not found then
    raise exception 'Notice not found';
  end if;

  if not public.current_user_has_permission(
    'notice.publish'::text,
    notice_record.division_id
  ) then
    raise exception 'You do not have permission to publish this notice';
  end if;

  if notice_record.status <> 'REVIEW'::notice_status then
    raise exception 'Only REVIEW notices can be published';
  end if;

  update public.notices
  set
    status = 'PUBLISHED'::notice_status,
    published_by = auth.uid(),
    published_at = now(),
    updated_by = auth.uid(),
    updated_at = now()
  where id = notice_id
  returning *
  into notice_record;

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
    notice_record.division_id,
    auth.uid(),
    'PUBLISH',
    'notice',
    notice_record.id,
    jsonb_build_object(
      'status', 'REVIEW'
    ),
    jsonb_build_object(
      'status', 'PUBLISHED',
      'published_by', auth.uid(),
      'published_at', notice_record.published_at
    ),
    jsonb_build_object(
      'transition', 'REVIEW_TO_PUBLISHED'
    )
  );

  return notice_record;

end;

$function$;


-- ------------------------------------------------------------
-- 3. Secure PUBLISHED -> ARCHIVED transition
-- ------------------------------------------------------------

create or replace function public.archive_notice(
  notice_id uuid
)
returns public.notices
language plpgsql
security definer
set search_path = public
as $function$

declare
  notice_record public.notices;
begin

  select *
  into notice_record
  from public.notices
  where id = notice_id;

  if not found then
    raise exception 'Notice not found';
  end if;

  if not public.current_user_has_permission(
    'notice.archive'::text,
    notice_record.division_id
  ) then
    raise exception 'You do not have permission to archive this notice';
  end if;

  if notice_record.status <> 'PUBLISHED'::notice_status then
    raise exception 'Only PUBLISHED notices can be archived';
  end if;

  update public.notices
  set
    status = 'ARCHIVED'::notice_status,
    updated_by = auth.uid(),
    updated_at = now()
  where id = notice_id
  returning *
  into notice_record;

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
    notice_record.division_id,
    auth.uid(),
    'ARCHIVE',
    'notice',
    notice_record.id,
    jsonb_build_object(
      'status', 'PUBLISHED'
    ),
    jsonb_build_object(
      'status', 'ARCHIVED'
    ),
    jsonb_build_object(
      'transition', 'PUBLISHED_TO_ARCHIVED'
    )
  );

  return notice_record;

end;

$function$;


-- ------------------------------------------------------------
-- 4. Restrict function execution
-- ------------------------------------------------------------

revoke all
on function public.submit_notice_for_review(uuid)
from public;

revoke all
on function public.publish_notice(uuid)
from public;

revoke all
on function public.archive_notice(uuid)
from public;


grant execute
on function public.submit_notice_for_review(uuid)
to authenticated;

grant execute
on function public.publish_notice(uuid)
to authenticated;

grant execute
on function public.archive_notice(uuid)
to authenticated;


-- ------------------------------------------------------------
-- 5. Secure the function search path
--
-- The functions are SECURITY DEFINER, so the search path is
-- explicitly fixed to public.
-- ------------------------------------------------------------