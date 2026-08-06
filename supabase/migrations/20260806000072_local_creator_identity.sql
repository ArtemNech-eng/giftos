-- Local Creator v1 expands into a broader city identity layer. This remains
-- a self-described profile context, not professional verification.
alter table public.local_creator_profiles
  add column if not exists city_label text check (city_label is null or char_length(city_label) <= 40);

alter table public.local_creator_profiles
  drop constraint if exists local_creator_profiles_role_code_check;
alter table public.local_creator_profiles
  add constraint local_creator_profiles_role_code_check
  check (role_code in (
    'creator', 'beauty', 'photo', 'music', 'fitness', 'education', 'events',
    'food', 'transport', 'retail', 'film', 'health', 'public', 'service', 'other'
  ));

-- The view is recreated to surface the optional human-readable city identity.
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
  local.city_label,
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
