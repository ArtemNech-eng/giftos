-- Pin a place: creator pins the hangout so it stays at the very top of the
-- city list for 7 days. Costs more than a boost (⭐). Same wallet/ledger
-- pattern as boost and wish promotions.

alter table public.bonus_settings
  add column if not exists place_pin_cost integer not null default 500 check (place_pin_cost > 0);

alter table public.places
  add column if not exists pinned_until timestamptz;

create or replace function public.pin_place_with_hocu_bonus(p_place_id uuid)
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
    raise exception 'Only the creator can pin an active place';
  end if;
  select place_pin_cost into cost from public.bonus_settings where id = true;
  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
  ends_at := greatest(coalesce((select pinned_until from public.places where id = p_place_id), now()), now()) + interval '7 days';

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'promotion_spend', jsonb_build_object('place_id', p_place_id, 'pin_until', ends_at));
  update public.places set pinned_until = ends_at where id = p_place_id;
  return ends_at;
end;
$$;

grant execute on function public.pin_place_with_hocu_bonus(uuid) to authenticated;

-- Pinned places go above everything else in the leaderboard.
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
