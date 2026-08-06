-- Public-safe pulse of a city. This is deliberately limited to activities
-- that already happen in publicly visible city spaces. It never contains DM,
-- paid-request, private fundraiser or gift-recipient information.
create or replace view public.public_city_pulse
with (security_invoker = false)
as
with recent_place_messages as (
  select distinct on (message.author_id, message.place_id)
    message.id,
    message.author_id,
    message.place_id,
    message.created_at
  from public.place_messages message
  where message.is_hidden = false
    and message.created_at >= now() - interval '24 hours'
  order by message.author_id, message.place_id, message.created_at desc
)
select
  place.city_id,
  'presence'::text as kind,
  profile.id as actor_id,
  profile.display_name as actor_name,
  profile.username::text as actor_username,
  profile.avatar_path as actor_avatar_path,
  place.id as target_id,
  place.name as target_name,
  place.emoji as target_emoji,
  null::text as target_slug,
  presence.last_seen_at as created_at
from public.place_presence presence
join public.places place on place.id = presence.place_id and place.is_active = true
join public.profiles profile on profile.id = presence.profile_id
where presence.last_seen_at >= now() - interval '15 minutes'
  and profile.profile_visibility = 'public'
  and profile.show_city = true
  and profile.city_id = place.city_id

union all

select
  place.city_id,
  'place_message'::text as kind,
  profile.id as actor_id,
  profile.display_name as actor_name,
  profile.username::text as actor_username,
  profile.avatar_path as actor_avatar_path,
  place.id as target_id,
  place.name as target_name,
  place.emoji as target_emoji,
  null::text as target_slug,
  message.created_at
from recent_place_messages message
join public.places place on place.id = message.place_id and place.is_active = true
join public.profiles profile on profile.id = message.author_id
where profile.profile_visibility = 'public'
  and profile.show_city = true
  and profile.city_id = place.city_id

union all

select
  room_host.city_id,
  'live'::text as kind,
  room_host.id as actor_id,
  room_host.display_name as actor_name,
  room_host.username::text as actor_username,
  room_host.avatar_path as actor_avatar_path,
  room.id as target_id,
  room.title as target_name,
  'LIVE'::text as target_emoji,
  room.slug as target_slug,
  room.started_at as created_at
from public.live_rooms room
join public.profiles room_host on room_host.id = room.host_id
where room.status = 'live'
  and room.visibility = 'public'
  and room_host.profile_visibility = 'public'
  and room_host.show_city = true

union all

select
  event.city_id,
  'event'::text as kind,
  event_host.id as actor_id,
  event_host.display_name as actor_name,
  event_host.username::text as actor_username,
  event_host.avatar_path as actor_avatar_path,
  event.id as target_id,
  event.title as target_name,
  'СОБЫТИЕ'::text as target_emoji,
  null::text as target_slug,
  event.created_at as created_at
from public.events event
join public.profiles event_host on event_host.id = event.author_id
where event.is_cancelled = false
  and event.starts_at >= now() - interval '4 hours'
  and event_host.profile_visibility = 'public'
  and event_host.show_city = true
  and event_host.city_id = event.city_id

union all

select
  reward.city_id,
  'ambassador'::text as kind,
  profile.id as actor_id,
  profile.display_name as actor_name,
  profile.username::text as actor_username,
  profile.avatar_path as actor_avatar_path,
  reward.city_id as target_id,
  city.name as target_name,
  'ПЕРВАЯ ВОЛНА'::text as target_emoji,
  null::text as target_slug,
  reward.earned_at as created_at
from public.city_ambassador_rewards reward
join public.profiles profile on profile.id = reward.profile_id
join public.cities city on city.id = reward.city_id
where profile.profile_visibility = 'public'
  and profile.show_city = true;

grant select on public.public_city_pulse to anon, authenticated;
