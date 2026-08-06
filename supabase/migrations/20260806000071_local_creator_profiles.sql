-- Local Creator v1: a voluntary city-native creator/professional layer.
-- This is not a booking or paid-services marketplace.
create table if not exists public.local_creator_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  is_listed boolean not null default false,
  role_code text not null default 'other' check (role_code in (
    'beauty', 'photo', 'music', 'fitness', 'education', 'events', 'food', 'service', 'other'
  )),
  headline text check (headline is null or char_length(headline) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.local_creator_profiles enable row level security;
create policy "users manage own local creator card" on public.local_creator_profiles
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- A safe city discover view. Only public profiles that choose both city
-- visibility and local listing enter it. Content activity is contextual, not
-- a purchasable ranking.
create or replace view public.public_local_creators
with (security_invoker = false)
as
select
  profile.id,
  profile.username::text as username,
  profile.display_name,
  profile.avatar_path,
  profile.city_id,
  city.name as city_name,
  local.role_code,
  local.headline,
  local.updated_at,
  live.slug as live_slug,
  live.title as live_title,
  story.id as story_id,
  event.id as event_id,
  event.title as event_title
from public.local_creator_profiles local
join public.profiles profile on profile.id = local.profile_id
join public.cities city on city.id = profile.city_id
left join lateral (
  select slug, title
  from public.live_rooms
  where host_id = profile.id
    and status = 'live'
    and visibility = 'public'
  order by started_at desc
  limit 1
) live on true
left join lateral (
  select id
  from public.stories
  where author_id = profile.id
    and expires_at > now()
  order by created_at desc
  limit 1
) story on true
left join lateral (
  select id, title
  from public.events
  where author_id = profile.id
    and city_id = profile.city_id
    and is_cancelled = false
    and starts_at >= now()
  order by starts_at asc
  limit 1
) event on true
where local.is_listed = true
  and profile.profile_visibility = 'public'
  and profile.show_city = true;

grant select on public.public_local_creators to anon, authenticated;
