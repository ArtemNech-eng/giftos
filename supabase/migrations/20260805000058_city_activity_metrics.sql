-- Living city activity metrics (TZ addendum #4, section 20) for the admin
-- dashboard: daily active users, place visits, hangout creation, invites,
-- streams and events per day.

create or replace view public.admin_city_activity_daily
with (security_invoker = false)
as
select
  d.day,
  (select count(distinct profile_id) from public.place_presence
    where last_seen_at >= d.day and last_seen_at < d.day + interval '1 day') as dau,
  (select count(*) from public.place_presence
    where entered_at >= d.day and entered_at < d.day + interval '1 day') as place_visits,
  (select count(*) from public.places
    where created_at >= d.day and created_at < d.day + interval '1 day' and kind <> 'fixed') as hangouts_created,
  (select count(*) from public.place_messages
    where created_at >= d.day and created_at < d.day + interval '1 day') as messages,
  (select count(*) from public.live_rooms
    where started_at >= d.day and started_at < d.day + interval '1 day') as streams_started,
  (select count(*) from public.events
    where created_at >= d.day and created_at < d.day + interval '1 day') as events_created,
  (select count(*) from public.referrals
    where created_at >= d.day and created_at < d.day + interval '1 day') as referrals,
  (select count(*) from public.profile_gifts
    where created_at >= d.day and created_at < d.day + interval '1 day') as gifts_sent
from generate_series(
  (select date_trunc('day', min(created_at)) from public.profiles),
  date_trunc('day', now()),
  interval '1 day'
) as d(day)
order by d.day desc
limit 30;

grant select on public.admin_city_activity_daily to authenticated;
