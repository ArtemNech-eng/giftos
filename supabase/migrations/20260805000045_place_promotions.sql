-- Place promotion with ⭐ bonuses: «Boost the hangout» lifts the place
-- to the top of the city list for 24 hours. Same economics and anti-abuse
-- pattern as wish promotions (cost from bonus_settings, spent from wallet,
-- ledger entry, idempotent history).

alter table public.bonus_settings
  add column if not exists place_promotion_cost integer not null default 200 check (place_promotion_cost > 0);

create table if not exists public.place_promotions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cost_bonus integer not null check (cost_bonus > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists place_promotions_place_idx on public.place_promotions (place_id, expires_at desc);

alter table public.place_promotions enable row level security;
create policy "owners see own place promotions" on public.place_promotions
  for select using (profile_id = auth.uid() or public.is_admin());

-- Promoted places surface first in the city list.
alter table public.places
  add column if not exists promoted_until timestamptz;

drop view if exists public.public_place_leaderboard;
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
  p.promoted_until,
  p.created_at,
  (select count(*) from public.place_members pm where pm.place_id = p.id) as member_count,
  (select count(*) from public.place_presence pp where pp.place_id = p.id and pp.last_seen_at >= now() - interval '15 minutes') as online_count
from public.places p
where p.is_active = true
order by
  (p.promoted_until is not null and p.promoted_until > now()) desc,
  p.popularity_score desc,
  member_count desc
limit 50;

create or replace function public.promote_place_with_hocu_bonus(p_place_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
  ends_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if not exists (
    select 1 from public.places
    where id = p_place_id and creator_id = auth.uid() and is_active = true
  ) then
    raise exception 'Only the creator can promote an active place';
  end if;
  select place_promotion_cost into cost from public.bonus_settings where id = true;
  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
  ends_at := greatest(coalesce((select promoted_until from public.places where id = p_place_id), now()), now()) + interval '24 hours';

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'promotion_spend', jsonb_build_object('place_id', p_place_id, 'expires_at', ends_at));
  update public.places set promoted_until = ends_at where id = p_place_id;
  insert into public.place_promotions (place_id, profile_id, cost_bonus, expires_at)
  values (p_place_id, auth.uid(), cost, ends_at);
  return ends_at;
end;
$$;

grant execute on function public.promote_place_with_hocu_bonus(uuid) to authenticated;
