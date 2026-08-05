-- Stage 4: place statuses and leaderboards.
-- Popularity of a place and leadership badges of its members are computed
-- from real activity (members, online, messages) — no manual boosts yet.

-- Popularity: a per-place counter refreshed by a trigger on messages.
alter table public.places
  add column if not exists popularity_score integer not null default 0 check (popularity_score >= 0);

-- Leaderboard view: most active places (fixed and personal/temporary).
create or replace view public.public_place_leaderboard
with (security_invoker = false)
as
select
  p.id,
  p.city_id,
  p.name,
  p.emoji,
  p.kind,
  p.popularity_score,
  p.created_at,
  (select count(*) from public.place_members pm where pm.place_id = p.id) as member_count,
  (select count(*) from public.place_presence pp where pp.place_id = p.id and pp.last_seen_at >= now() - interval '15 minutes') as online_count
from public.places p
where p.is_active = true
order by p.popularity_score desc, member_count desc
limit 50;

grant select on public.public_place_leaderboard to anon, authenticated;

-- Refresh popularity on new messages.
create or replace function public.bump_place_popularity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.places
  set popularity_score = popularity_score + 1
  where id = new.place_id;
  return new;
end;
$$;

drop trigger if exists place_messages_bump_popularity on public.place_messages;
create trigger place_messages_bump_popularity
  after insert on public.place_messages
  for each row execute procedure public.bump_place_popularity();
