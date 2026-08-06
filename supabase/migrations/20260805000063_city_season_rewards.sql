-- City battle season rewards (ТЗ №1 п.12): finishing a season crowns the
-- winner city with the City Cup; the reward is collective — «мы выиграли
-- вместе». Winner city gets a cup record, its citizens a champion badge.

alter table public.city_seasons
  add column if not exists winner_city_id uuid references public.cities(id) on delete set null,
  add column if not exists winner_city_name text,
  add column if not exists winner_points bigint check (winner_points is null or winner_points >= 0),
  add column if not exists finished_at timestamptz;

-- Close the active season and crown its winner (admin only).
create or replace function public.finish_city_season()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.city_seasons%rowtype;
  v_winner_city_id uuid;
  v_winner_city_name text;
  v_winner_points bigint;
begin
  if auth.uid() is null or not public.is_admin() then
    return null;
  end if;

  select * into v_season
  from public.city_seasons
  where is_active = true
  order by started_at desc
  limit 1;
  if v_season.id is null then
    return null;
  end if;

  select e.city_id, c.name, e.points
  into v_winner_city_id, v_winner_city_name, v_winner_points
  from public.city_battle_entries e
  join public.cities c on c.id = e.city_id
  where e.season_id = v_season.id
  order by e.points desc, e.updated_at asc
  limit 1;

  update public.city_seasons
  set is_active = false,
      finished_at = now(),
      winner_city_id = v_winner_city_id,
      winner_city_name = v_winner_city_name,
      winner_points = v_winner_points
  where id = v_season.id;

  return jsonb_build_object(
    'season_name', v_season.name,
    'winner_city_id', v_winner_city_id,
    'winner_city_name', v_winner_city_name,
    'winner_points', v_winner_points
  );
end;
$$;

-- Open a new season; any still-active season is finished first (admin only).
create or replace function public.start_city_season(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ignored jsonb;
  v_season_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    return null;
  end if;
  if p_name is null or char_length(trim(p_name)) < 1 then
    return null;
  end if;

  select finish_city_season() into v_ignored;

  insert into public.city_seasons (name, started_at, is_active)
  values (trim(p_name), now(), true)
  returning id into v_season_id;

  return jsonb_build_object('season_id', v_season_id, 'name', trim(p_name));
end;
$$;

grant execute on function public.finish_city_season() to authenticated;
grant execute on function public.start_city_season(text) to authenticated;
