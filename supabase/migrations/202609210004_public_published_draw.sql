/*
  Public published tournament draw access

  Public visibility:
    PUBLISHED -> public
    LOCKED    -> public

  GENERATED / REVIEWED remain private.

  This function intentionally returns a controlled JSON
  payload instead of exposing the underlying draw tables
  directly to anonymous users.
*/

create or replace function public.get_published_tournament_draw(
  p_tournament_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_result jsonb;
begin
  /*
    Build the public draw payload only when a published
    or locked draw exists.
  */
  select jsonb_build_object(
    'tournament', jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'format', t.format,
      'status', t.status,
      'start_date', t.start_date,
      'end_date', t.end_date
    ),

    'draw', jsonb_build_object(
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
                    'position', gt.position,
                    'club', jsonb_build_object(
                      'id', c.id,
                      'name', c.name,
                      'short_name', c.short_name,
                      'logo_path', c.logo_path
                    )
                  )
                  order by gt.position
                )
                from public.group_teams gt
                join public.tournament_teams tt
                  on tt.id = gt.tournament_team_id
                join public.clubs c
                  on c.id = tt.club_id
                where gt.group_id = tg.id
                  and tt.registration_status = 'ACTIVE'
                  and c.status = 'ACTIVE'
              ),
              '[]'::jsonb
            )
          )
          order by tg.display_order
        )
        from public.tournament_groups tg
        where tg.tournament_id = t.id
          and tg.status = 'ACTIVE'
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

            'team', jsonb_build_object(
              'id', c1.id,
              'name', c1.name,
              'short_name', c1.short_name,
              'logo_path', c1.logo_path
            ),

            'opponent', jsonb_build_object(
              'id', c2.id,
              'name', c2.name,
              'short_name', c2.short_name,
              'logo_path', c2.logo_path
            )
          )
          order by
            dr.round,
            dr.position
        )
        from public.draw_results dr
        join public.tournament_teams tt1
          on tt1.id = dr.tournament_team_id
        join public.clubs c1
          on c1.id = tt1.club_id
        left join public.tournament_teams tt2
          on tt2.id = dr.opponent_team_id
        left join public.clubs c2
          on c2.id = tt2.club_id
        where dr.draw_id = td.id
      ),
      '[]'::jsonb
    )
  )
  into v_result

  from public.tournaments t
  join public.tournament_draws td
    on td.tournament_id = t.id

  where t.id = p_tournament_id
    and t.division_id = '89304127-99c2-4427-8edd-87a9aff3e167'
    and td.status in ('PUBLISHED', 'LOCKED')

  order by td.created_at desc
  limit 1;

  /*
    If the draw isn't published, return NULL.

    This is important: anonymous callers cannot distinguish
    an unpublished draw from a missing draw through this RPC.
  */
  return v_result;
end;
$function$;

revoke all
on function public.get_published_tournament_draw(uuid)
from public;

grant execute
on function public.get_published_tournament_draw(uuid)
to anon;

grant execute
on function public.get_published_tournament_draw(uuid)
to authenticated;