-- City battle: seasonal competition between cities.
-- Points are awarded only for qualified actions (same anti-fraud pattern as
-- referrals: meaningful activity, not mere registration). The score event
-- journal is unique per (season, event_type, source) so nothing can be
-- double-counted by replays or duplicate calls.

create table if not exists public.city_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.city_battle_entries (
  season_id uuid not null references public.city_seasons(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  points bigint not null default 0 check (points >= 0),
  updated_at timestamptz not null default now(),
  primary key (season_id, city_id)
);

create table if not exists public.city_score_events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.city_seasons(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 60),
  points integer not null check (points > 0),
  source_id text,
  created_at timestamptz not null default now(),
  unique (season_id, event_type, source_id)
);
create index if not exists city_score_events_season_idx on public.city_score_events (season_id, city_id, created_at desc);

alter table public.city_seasons enable row level security;
alter table public.city_battle_entries enable row level security;
alter table public.city_score_events enable row level security;

create policy "seasons readable" on public.city_seasons for select using (true);
create policy "battle entries readable" on public.city_battle_entries for select using (true);
create policy "score events readable" on public.city_score_events for select using (true);

-- Seed: first season.
insert into public.city_seasons (name, started_at, is_active)
values ('Сезон 1', now(), true)
on conflict do nothing;

-- Award city points to the caller's city for a qualified action.
-- source_id is a business key (e.g. wish id, live room id) that makes the
-- event idempotent: the same action can never award points twice.
create or replace function public.award_city_points(
  p_event_type text,
  p_points integer,
  p_source_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season_id uuid;
  v_city_id uuid;
  v_inserted uuid;
begin
  if auth.uid() is null then return false; end if;
  if p_points <= 0 then return false; end if;

  select id into v_season_id from public.city_seasons
  where is_active = true and (ended_at is null or ended_at > now())
  order by started_at desc limit 1;
  if v_season_id is null then return false; end if;

  select city_id into v_city_id from public.profiles where id = auth.uid();
  if v_city_id is null then return false; end if;

  insert into public.city_score_events (season_id, city_id, profile_id, event_type, points, source_id)
  values (v_season_id, v_city_id, auth.uid(), p_event_type, p_points, p_source_id)
  on conflict (season_id, event_type, source_id) do nothing
  returning id into v_inserted;

  if v_inserted is not null then
    update public.city_battle_entries
    set points = points + p_points, updated_at = now()
    where season_id = v_season_id and city_id = v_city_id;
    if not found then
      insert into public.city_battle_entries (season_id, city_id, points)
      values (v_season_id, v_city_id, p_points)
      on conflict (season_id, city_id) do update
        set points = city_battle_entries.points + excluded.points, updated_at = now();
    end if;
  end if;

  return true;
end;
$$;

grant execute on function public.award_city_points(text, integer, text) to authenticated;
