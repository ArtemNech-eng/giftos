-- Growing wishes: «Хочу также» interest gained within the last 7 days.
-- Security definer like the other public presentation views; only public,
-- non-archived wishes are exposed.

create or replace view public.public_growing_wishes
with (security_invoker = false)
as
select
  w.id,
  w.author_id,
  w.title,
  w.category_slug,
  w.estimated_cost_minor,
  w.also_wants_count,
  w.created_at,
  count(aw.profile_id) filter (
    where aw.created_at >= now() - interval '7 days'
  ) as weekly_also_wants
from public.wishes w
left join public.wish_also_wants aw on aw.wish_id = w.id
where w.visibility = 'public'
  and not w.is_archived
group by w.id
having count(aw.profile_id) filter (
  where aw.created_at >= now() - interval '7 days'
) > 0
order by weekly_also_wants desc, w.also_wants_count desc, w.created_at desc
limit 20;

grant select on public.public_growing_wishes to anon, authenticated;
