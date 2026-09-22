/*
 * ----------------------------------------------------------
 * PUBLIC TOURNAMENT LISTING
 * ----------------------------------------------------------
 *
 * Exposes only IDCA tournaments whose latest draw is
 * officially PUBLISHED or LOCKED.
 *
 * This function is intentionally SECURITY DEFINER so the
 * public website does not need direct SELECT access to the
 * underlying tournament administration tables.
 *
 * No draft, registration, generated, or reviewed tournament
 * is exposed.
 *
 * ----------------------------------------------------------
 */

create or replace function public.get_public_tournaments()
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$

declare
  v_result jsonb;
begin

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', x.id,
        'name', x.name,
        'slug', x.slug,
        'format', x.format,
        'status', x.status,
        'start_date', x.start_date,
        'end_date', x.end_date,
        'session', x.session_data,
        'club_category', x.club_category_data,
        'age_category', x.age_category_data,
        'draw_status', x.draw_status,
        'draw_published_at', x.draw_published_at
      )
      order by
        x.start_date nulls last,
        x.created_at desc
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select distinct on (t.id)
      t.id,
      t.name,
      t.slug,
      t.format,
      t.status,
      t.start_date,
      t.end_date,
      t.created_at,

      jsonb_build_object(
        'id', s.id,
        'name', s.name
      ) as session_data,

      case
        when cc.id is null then null
        else jsonb_build_object(
          'id', cc.id,
          'name', cc.name,
          'code', cc.code
        )
      end as club_category_data,

      case
        when ac.id is null then null
        else jsonb_build_object(
          'id', ac.id,
          'name', ac.name,
          'code', ac.code
        )
      end as age_category_data,

      td.status as draw_status,
      td.published_at as draw_published_at

    from public.tournaments t

    join public.tournament_draws td
      on td.tournament_id = t.id

    join public.sessions s
      on s.id = t.session_id

    left join public.club_categories cc
      on cc.id = t.club_category_id

    left join public.age_categories ac
      on ac.id = t.age_category_id

    where t.division_id =
      '89304127-99c2-4427-8edd-87a9aff3e167'

      and td.status in (
        'PUBLISHED',
        'LOCKED'
      )

    order by
      t.id,
      td.created_at desc
  ) x;

  return v_result;

end;
$function$;


/*
 * ----------------------------------------------------------
 * PUBLIC EXECUTION
 * ----------------------------------------------------------
 */

grant execute
on function public.get_public_tournaments()
to anon;

grant execute
on function public.get_public_tournaments()
to authenticated;