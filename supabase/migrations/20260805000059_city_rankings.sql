-- Social city rankings (TZ addendum #5, stage 1).
-- Composite score: activity 40% / city contribution 25% / hangout 20% /
-- author activity 15%. Rank is NOT sold: paid tools only increase
-- attention, which then drives real activity.

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
    (select count(*) from public.user_follows uf where uf.following_id = p.id) as followers,
    (select count(*) from public.place_messages pm where pm.author_id = p.id) as messages,
    (select count(*) from public.place_presence pp where pp.profile_id = p.id) as visits,
    (select count(*) from public.referrals r where r.referrer_id = p.id and r.status in ('qualified','held','approved')) as referrals,
    (select count(*) from public.events e where e.author_id = p.id) as events,
    (select count(distinct pm2.place_id) from public.place_members pm2 where pm2.profile_id = p.id) as hangout_memberships,
    (select coalesce(sum(pl.popularity_score), 0) from public.places pl where pl.creator_id = p.id) as hangout_popularity,
    (select count(*) from public.live_rooms lr where lr.host_id = p.id) as lives,
    (select count(*) from public.place_messages pm3 where pm3.author_id = p.id and pm3.created_at >= now() - interval '7 days') as messages_week,
    (select count(*) from public.user_follows uf2 where uf2.following_id = p.id and uf2.created_at >= now() - interval '7 days') as followers_week
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
where s.city_id is not null and s.messages > 0;

grant select on public.public_city_rankings to anon, authenticated;

-- Reputation roles (TZ addendum #5, stage 2): real achievements only.
create or replace function public.reputation_roles(p_profile_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  roles text[] := '{}';
  v_followers bigint;
  v_lives bigint;
  v_messages bigint;
  v_hangout_members bigint;
  v_created timestamptz;
begin
  select count(*) into v_followers from public.user_follows uf where uf.following_id = p_profile_id;
  select count(*) into v_lives from public.live_rooms lr where lr.host_id = p_profile_id;
  select count(*) into v_messages from public.place_messages pm where pm.author_id = p_profile_id;
  select coalesce(sum(pm.member_count), 0) into v_hangout_members
  from (select count(*) as member_count from public.place_members pm where pm.place_id in (select id from public.places where creator_id = p_profile_id) group by pm.place_id) pm;
  select created_at into v_created from public.profiles where id = p_profile_id;

  if v_hangout_members >= 50 then roles := roles || 'Лидер сообщества'; end if;
  if v_lives >= 5 then roles := roles || 'Лучший ведущий'; end if;
  if v_messages >= 300 then roles := roles || 'Душа города'; end if;
  if v_followers >= 50 and v_created >= now() - interval '14 days' then roles := roles || 'Открытие недели'; end if;
  if v_followers >= 500 then roles := roles || 'Амбассадор'; end if;
  if v_followers >= 5000 then roles := roles || 'Легенда города'; end if;

  return roles;
end;
$$;

grant execute on function public.reputation_roles(uuid) to anon, authenticated;
