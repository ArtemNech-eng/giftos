-- Pre-production icon-system migration. There is no production user data yet,
-- so screens may move from OS emoji to stable semantic icon codes immediately.
alter table public.places
  add column if not exists icon_code text;

update public.places
set icon_code = case
  when emoji in ('🏙', '📍') then 'center'
  when emoji in ('🎵', '🎶') then 'music'
  when emoji = '🎮' then 'gaming'
  when emoji in ('🌙', '🌃') then 'night'
  when emoji in ('❤️', '💬') then 'meet'
  when emoji in ('🏋️', '⚽') then 'sport'
  when emoji in ('☕', '🥤') then 'coffee'
  when emoji in ('📅', '🎪') then 'event'
  when emoji in ('🏠', '🏡') then 'home'
  else 'place'
end
where icon_code is null;

alter table public.places
  alter column icon_code set default 'place',
  alter column icon_code set not null;

alter table public.places
  drop constraint if exists places_icon_code_check;
alter table public.places
  add constraint places_icon_code_check
  check (icon_code in ('center', 'music', 'gaming', 'night', 'meet', 'sport', 'coffee', 'event', 'home', 'place'));

-- New leaderboards expose only semantic icon codes to the UI. The old emoji
-- column stays in the table temporarily so older historical migrations remain
-- reproducible, but is no longer a presentation dependency.
drop view if exists public.public_place_leaderboard;
create or replace view public.public_place_leaderboard
with (security_invoker = false)
as
select
  p.id,
  p.city_id,
  p.name,
  p.icon_code,
  p.kind,
  p.popularity_score,
  p.promoted_until,
  p.pinned_until,
  p.created_at,
  (select count(*) from public.place_members pm where pm.place_id = p.id) as member_count,
  (select count(*) from public.place_presence pp where pp.place_id = p.id and pp.last_seen_at >= now() - interval '15 minutes') as online_count
from public.places p
where p.is_active = true
order by
  (p.pinned_until is not null and p.pinned_until > now()) desc,
  (p.promoted_until is not null and p.promoted_until > now()) desc,
  p.popularity_score desc,
  member_count desc
limit 50;

grant select on public.public_place_leaderboard to anon, authenticated;
