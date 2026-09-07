-- Allow parent-organization administrators to administer
-- their child divisions while preserving division isolation.

create or replace function public.current_user_has_permission(
  requested_permission text,
  requested_division uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp
      on rp.role_id = ur.role_id
    join public.permissions p
      on p.id = rp.permission_id
    left join public.organizations target_org
      on target_org.id = requested_division
    where ur.user_id = auth.uid()
      and p.code = requested_permission
      and (
        requested_division is null

        -- Direct permission for the requested division
        or ur.division_id = requested_division

        -- Parent organization permission for a child division
        or (
          target_org.parent_organization_id is not null
          and ur.division_id = target_org.parent_organization_id
        )
      )
  );
$function$;