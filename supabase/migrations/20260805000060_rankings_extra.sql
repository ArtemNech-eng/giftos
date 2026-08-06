-- TZ addendum #5, section 7: add the two missing rankings.
-- 'discovery' — new user of the month (registered within 30 days,
-- ranked by followers gained);
-- 'favorite' — community favorite (most profile gifts received).

drop view if exists public.public_city_rankings;

create or replace view public.public_city_rankings
with (security_invoker = false)
as
with stats as (
  select
    p.id as profile_id,
    p.city_id,
    p.display_name,
    p.username,
    p.avatar_path,
    p.is_creator,
    p.created_at,
    (select count(*) from public.user_follows uf where uf.following_id = p.id) as followers,
    (select count(*) from public.place_messages pm where pm.author_id = p.id) as messages,
    (select count(*) from public.place_presence pp where pp.profile_id = p.id) as visits,
    (select count(*) from public.referrals r where r.referrer_id = p.id and r.status in ('qualified','held','approved')) as referrals,
    (select count(*) from public.events e where e.author_id = p.id) as events,
    (select count(distinct pm2.place_id) from public.place_members pm2 where pm2.profile_id = p.id) as hangout_memberships,
    (select coalesce(sum(pl.popularity_score), 0) from public.places pl where pl.creator_id = p.id) as hangout_popularity,
    (select count(*) from public.live_rooms lr where lr.host_id = p.id) as lives,
    (select count(*) from public.place_messages pm3 where pm3.author_id = p.id and pm3.created_at >= now() - interval '7 days') as messages_week,
    (select count(*) from public.user_follows uf2 where uf2.following_id = p.id and uf2.created_at >= now() - interval '7 days') as followers_week,
    (select count(*) from public.profile_gifts pg where pg.recipient_id = p.id) as gifts_received,
    (select count(*) from public.place_gifts lpg where lpg.recipient_id = p.id) as place_gifts_received
  from public.profiles p
  where p.profile_visibility = 'public' and p.is_suspended = false
)
select
  s.city_id,
  'top' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(
    0.40 * least(s.messages + s.visits, 1000)
    + 0.25 * least(s.referrals * 50 + s.events * 20, 500)
    + 0.20 * least(s.hangout_memberships * 30 + s.hangout_popularity, 500)
    + 0.15 * least(s.followers + s.lives * 50, 1000)
  ) as score,
  row_number() over (partition by s.city_id order by
    (0.40 * least(s.messages + s.visits, 1000)
     + 0.25 * least(s.referrals * 50 + s.events * 20, 500)
     + 0.20 * least(s.hangout_memberships * 30 + s.hangout_popularity, 500)
     + 0.15 * least(s.followers + s.lives * 50, 1000)) desc
  ) as rank
from stats s
where s.city_id is not null

union all

select
  s.city_id,
  'hangout' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(least(s.hangout_memberships * 40 + s.hangout_popularity, 1000)) as score,
  row_number() over (partition by s.city_id order by (s.hangout_memberships * 40 + s.hangout_popularity) desc) as rank
from stats s
where s.city_id is not null and s.hangout_popularity > 0

union all

select
  s.city_id,
  'streamer' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(least(s.followers + s.lives * 80, 1000)) as score,
  row_number() over (partition by s.city_id order by (s.followers + s.lives * 80) desc) as rank
from stats s
where s.city_id is not null and s.lives > 0

union all

select
  s.city_id,
  'rising' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(least(s.followers_week * 50 + s.messages_week, 1000)) as score,
  row_number() over (partition by s.city_id order by (s.followers_week * 50 + s.messages_week) desc) as rank
from stats s
where s.city_id is not null and (s.followers_week > 0 or s.messages_week > 0)

union all

select
  s.city_id,
  'social' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(least(s.messages + s.visits, 1000)) as score,
  row_number() over (partition by s.city_id order by (s.messages + s.visits) desc) as rank
from stats s
where s.city_id is not null and s.messages > 0

union all

-- 🌟 New discovery of the month: registered within 30 days.
select
  s.city_id,
  'discovery' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(least(s.followers * 20 + s.messages, 1000)) as score,
  row_number() over (partition by s.city_id order by (s.followers * 20 + s.messages) desc) as rank
from stats s
where s.city_id is not null
  and s.created_at >= now() - interval '30 days'

union all

-- ❤️ Community favorite: most gifts received on the profile.
select
  s.city_id,
  'favorite' as category,
  s.profile_id,
  s.display_name,
  s.username::text as username,
  s.avatar_path,
  s.is_creator,
  round(least(s.gifts_received * 100 + s.place_gifts_received * 50, 1000)) as score,
  row_number() over (partition by s.city_id order by (s.gifts_received * 100 + s.place_gifts_received * 50) desc) as rank
from stats s
where s.city_id is not null and (s.gifts_received > 0 or s.place_gifts_received > 0);

grant select on public.public_city_rankings to anon, authenticated;
