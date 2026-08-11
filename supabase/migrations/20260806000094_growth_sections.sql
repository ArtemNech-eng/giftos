-- Growth sections (plan item 7): «new / popular / rising» for people and
-- places, computed from real accumulated activity. Only public profiles and
-- active places appear; views are security definer like the other public
-- recommendation views and expose no private data.

-- Rising people: public profiles with new followers within the last 7 days.
-- weekly_followers > 0 means the person is actually gaining attention now,
-- not just historically popular.
create or replace view public.public_growing_people
with (security_invoker = false)
as
select
  p.id,
  p.username::text as username,
  p.display_name,
  p.avatar_path,
  p.city,
  p.city_id,
  p.is_creator,
  p.created_at,
  (select count(*) from public.user_follows uf where uf.following_id = p.id) as follower_count,
  (select count(*) from public.user_follows uf
     where uf.following_id = p.id
       and uf.created_at >= now() - interval '7 days') as weekly_followers
from public.profiles p
where p.profile_visibility = 'public'
  and p.is_suspended = false
  and exists (
    select 1 from public.user_follows uf
    where uf.following_id = p.id
      and uf.created_at >= now() - interval '7 days'
  )
order by weekly_followers desc, follower_count desc
limit 30;

-- Popular places: active places ranked by real activity within 7 days
-- (messages + members + people present right now). Places with zero recent
-- activity simply don't make the cut.
create or replace view public.public_popular_places
with (security_invoker = false)
as
select
  pl.id,
  pl.name,
  pl.description,
  pl.icon_code,
  pl.kind,
  pl.city_id,
  pl.created_at,
  (
    (select count(*) from public.place_messages m
      where m.place_id = pl.id
        and m.is_hidden = false
        and m.created_at >= now() - interval '7 days')
    +
    (select count(*) from public.place_members pm where pm.place_id = pl.id)
    +
    (select count(*) from public.place_presence pp
      where pp.place_id = pl.id
        and pp.last_seen_at >= now() - interval '15 minutes')
  ) as activity_score
from public.places pl
where pl.is_active = true
  and exists (
    select 1 from public.place_messages m
    where m.place_id = pl.id
      and m.is_hidden = false
      and m.created_at >= now() - interval '7 days'
  )
order by activity_score desc, pl.created_at desc
limit 30;

grant select on public.public_growing_people, public.public_popular_places to anon, authenticated;
