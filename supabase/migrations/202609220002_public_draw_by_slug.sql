/*
 * ----------------------------------------------------------
 * PUBLIC PUBLISHED TOURNAMENT DRAW — BY SLUG
 * ----------------------------------------------------------
 *
 * Returns the latest officially published/locked draw for
 * an IDCA tournament identified by its public slug.
 *
 * Public users can only see:
 *
 *   PUBLISHED
 *   LOCKED
 *
 * Draws in GENERATED or REVIEWED state are never exposed.
 *
 * ----------------------------------------------------------
 */

create or replace function public.get_published_tournament_draw_by_slug(
  p_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$

declare
  v_result jsonb;
begin

  if p_slug is null
     or trim(p_slug) = '' then
    return null;
  end if;

  select jsonb_build_object(

    'tournament',
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'format', t.format,
      'status', t.status,
      'start_date', t.start_date,
      'end_date', t.end_date
    ),

    'draw',
    jsonb_build_object(
      'status', td.status,
      'published_at', td.published_at
    ),

    'groups',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', tg.id,
            'name', tg.name,
            'display_order', tg.display_order,
            'teams',
            coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', gt.id,
                    'position', gt.position,
                    'team',
                    jsonb_build_object(
                      'id', tt.id,
                      'club',
                      jsonb_build_object(
                        'id', c.id,
                        'name', c.name,
                        'short_name', c.short_name,
                        'logo_path', c.logo_path
                      )
                    )
                  )
                  order by
                    gt.position nulls last,
                    c.name
                )
                from public.group_teams gt
                join public.tournament_teams tt
                  on tt.id = gt.tournament_team_id
                join public.clubs c
                  on c.id = tt.club_id
                where gt.group_id = tg.id
              ),
              '[]'::jsonb
            )
          )
          order by tg.display_order
        )
        from public.tournament_groups tg
        where tg.tournament_id = t.id
      ),
      '[]'::jsonb
    ),

    'pairings',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', dr.id,
            'group_id', dr.group_id,
            'round', dr.round,
            'position', dr.position,

            'team',
            jsonb_build_object(
              'id', tt.id,
              'club',
              jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'short_name', c.short_name,
                'logo_path', c.logo_path
              )
            ),

            'opponent',
            case
              when dr.opponent_team_id is null then null
              else jsonb_build_object(
                'id', ott.id,
                'club',
                jsonb_build_object(
                  'id', oc.id,
                  'name', oc.name,
                  'short_name', oc.short_name,
                  'logo_path', oc.logo_path
                )
              )
            end
          )
          order by
            dr.round nulls last,
            dr.position nulls last,
            dr.created_at
        )
        from public.draw_results dr

        join public.tournament_teams tt
          on tt.id = dr.tournament_team_id

        join public.clubs c
          on c.id = tt.club_id

        left join public.tournament_teams ott
          on ott.id = dr.opponent_team_id

        left join public.clubs oc
          on oc.id = ott.club_id

        where dr.draw_id = td.id
      ),
      '[]'::jsonb
    )

  )
  into v_result

  from public.tournaments t

  join public.tournament_draws td
    on td.tournament_id = t.id

  where t.slug = trim(p_slug)

    and t.division_id =
      '89304127-99c2-4427-8edd-87a9aff3e167'

    and td.status in (
      'PUBLISHED',
      'LOCKED'
    )

  order by td.created_at desc

  limit 1;

  return v_result;

end;
$function$;


/*
 * ----------------------------------------------------------
 * PUBLIC EXECUTION
 * ----------------------------------------------------------
 */

grant execute
on function public.get_published_tournament_draw_by_slug(text)
to anon;

grant execute
on function public.get_published_tournament_draw_by_slug(text)
to authenticated;