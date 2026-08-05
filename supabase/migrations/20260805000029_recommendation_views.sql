-- Recommendation views: popularity and growth computed from real activity
-- (no ML). Only public, published collections and public creators appear.
-- Views are security definer like public_fundraiser_feed and filter by
-- visibility/status themselves; they expose no private data.

-- Popular fundraisers: weighted score from confirmed supports, comments,
-- followers and participants.
create or replace view public.public_popular_fundraisers
with (security_invoker = false)
as
select
  f.id,
  f.slug::text as slug,
  f.wish_id,
  f.title,
  f.description,
  f.category_slug,
  f.target_amount_minor,
  f.current_amount_minor,
  f.participant_count,
  f.currency,
  f.status,
  f.published_at,
  p.username::text as author_username,
  p.display_name as author_display_name,
  p.avatar_path as author_avatar_path,
  (
    (select count(*) from public.fundraiser_supports s where s.fundraiser_id = f.id and s.status = 'succeeded') * 3
    + (select count(*) from public.fundraiser_comments c where c.fundraiser_id = f.id and c.is_hidden = false and c.deleted_at is null) * 2
    + (select count(*) from public.fundraiser_follows ff where ff.fundraiser_id = f.id)
    + f.participant_count
  ) as activity_score
from public.fundraisers f
join public.profiles p on p.id = f.author_id
where f.visibility = 'public'
  and f.status in ('active', 'goal_reached')
  and p.is_suspended = false
order by activity_score desc, f.published_at desc
limit 20;

-- Growing fundraisers: confirmed supports within the last 7 days.
create or replace view public.public_growing_fundraisers
with (security_invoker = false)
as
select
  f.id,
  f.slug::text as slug,
  f.wish_id,
  f.title,
  f.description,
  f.category_slug,
  f.target_amount_minor,
  f.current_amount_minor,
  f.participant_count,
  f.currency,
  f.status,
  f.published_at,
  p.username::text as author_username,
  p.display_name as author_display_name,
  p.avatar_path as author_avatar_path,
  count(s.id) filter (where s.status = 'succeeded' and s.succeeded_at >= now() - interval '7 days') as weekly_supports
from public.fundraisers f
join public.profiles p on p.id = f.author_id
left join public.fundraiser_supports s on s.fundraiser_id = f.id
where f.visibility = 'public'
  and f.status in ('active', 'goal_reached')
  and p.is_suspended = false
group by f.id, p.username, p.display_name, p.avatar_path
having count(s.id) filter (where s.status = 'succeeded' and s.succeeded_at >= now() - interval '7 days') > 0
order by weekly_supports desc, f.published_at desc
limit 20;

-- Recommended authors: public creators ordered by follower count.
create or replace view public.public_recommended_authors
with (security_invoker = false)
as
select
  p.id,
  p.username::text as username,
  p.display_name,
  p.avatar_path,
  p.city,
  p.creator_headline,
  (select count(*) from public.user_follows uf where uf.following_id = p.id) as follower_count
from public.profiles p
where p.is_creator = true
  and p.profile_visibility = 'public'
  and p.is_suspended = false
order by follower_count desc, p.created_at asc
limit 20;

grant select on public.public_popular_fundraisers, public.public_growing_fundraisers, public.public_recommended_authors to anon, authenticated;
