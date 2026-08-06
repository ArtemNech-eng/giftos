-- First-wave city ambassadors: an earned local status for bringing three
-- active residents into the same city. The award is activity-based; it is
-- never purchasable with money or ⭐.
create table if not exists public.city_ambassador_rewards (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  active_referrals_at_unlock integer not null check (active_referrals_at_unlock >= 3),
  promotion_credits integer not null default 1 check (promotion_credits >= 0),
  earned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, city_id)
);
create index if not exists city_ambassador_rewards_city_idx
  on public.city_ambassador_rewards (city_id, earned_at asc);

alter table public.city_ambassador_rewards enable row level security;
create policy "users see own ambassador rewards" on public.city_ambassador_rewards
  for select using (profile_id = auth.uid() or public.is_admin());

-- A free ambassador promotion is still recorded in the normal place
-- promotion history, but does not pretend to be a ⭐ spend.
alter table public.place_promotions
  add column if not exists source text not null default 'stars'
    check (source in ('stars', 'ambassador'));
alter table public.place_promotions
  drop constraint if exists place_promotions_cost_bonus_check;
alter table public.place_promotions
  add constraint place_promotions_cost_bonus_check check (cost_bonus >= 0);

-- Progress intentionally returns no name, username, email or other personal
-- data of invited people. It counts only referrals whose profile is still in
-- the ambassador's current city and who completed the real first action.
create or replace function public.city_ambassador_progress()
returns table (
  city_id uuid,
  city_name text,
  active_referrals integer,
  required_referrals integer,
  is_ambassador boolean,
  promotion_credits integer,
  earned_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    owner.city_id,
    city.name,
    (count(referral.id) filter (where invited.id is not null))::integer as active_referrals,
    3 as required_referrals,
    reward.profile_id is not null as is_ambassador,
    coalesce(reward.promotion_credits, 0) as promotion_credits,
    reward.earned_at
  from public.profiles owner
  left join public.cities city on city.id = owner.city_id
  left join public.referrals referral
    on referral.referrer_id = owner.id
   and referral.status in ('qualified', 'held', 'approved')
  left join public.profiles invited
    on invited.id = referral.referee_id
   and invited.city_id = owner.city_id
  left join public.city_ambassador_rewards reward
    on reward.profile_id = owner.id
   and reward.city_id = owner.city_id
  where owner.id = auth.uid()
  group by owner.city_id, city.name, reward.profile_id, reward.promotion_credits, reward.earned_at;
$$;

grant execute on function public.city_ambassador_progress() to authenticated;

create or replace function public.claim_city_ambassador_reward()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  my_city_id uuid;
  referral_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select city_id into my_city_id from public.profiles where id = auth.uid();
  if my_city_id is null then raise exception 'Choose a city first'; end if;

  select count(*) into referral_count
  from public.referrals referral
  join public.profiles invited on invited.id = referral.referee_id
  where referral.referrer_id = auth.uid()
    and invited.city_id = my_city_id
    and referral.status in ('qualified', 'held', 'approved');
  if referral_count < 3 then raise exception 'Three active city referrals are required'; end if;

  insert into public.city_ambassador_rewards (
    profile_id,
    city_id,
    active_referrals_at_unlock,
    promotion_credits
  )
  values (auth.uid(), my_city_id, referral_count, 1)
  on conflict (profile_id, city_id) do nothing;

  return true;
end;
$$;

grant execute on function public.claim_city_ambassador_reward() to authenticated;

create or replace function public.use_city_ambassador_promotion(p_place_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  place_city_id uuid;
  ends_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select city_id into place_city_id
  from public.places
  where id = p_place_id
    and creator_id = auth.uid()
    and kind <> 'fixed'
    and is_active = true;
  if place_city_id is null then raise exception 'Only the creator can promote an active personal place'; end if;

  perform 1
  from public.city_ambassador_rewards
  where profile_id = auth.uid()
    and city_id = place_city_id
    and promotion_credits > 0
  for update;
  if not found then raise exception 'Ambassador promotion credit is unavailable'; end if;

  ends_at := greatest(
    coalesce((select promoted_until from public.places where id = p_place_id), now()),
    now()
  ) + interval '24 hours';

  update public.city_ambassador_rewards
  set promotion_credits = promotion_credits - 1,
      updated_at = now()
  where profile_id = auth.uid()
    and city_id = place_city_id
    and promotion_credits > 0;

  update public.places set promoted_until = ends_at where id = p_place_id;
  insert into public.place_promotions (place_id, profile_id, cost_bonus, source, expires_at)
  values (p_place_id, auth.uid(), 0, 'ambassador', ends_at);
  return ends_at;
end;
$$;

grant execute on function public.use_city_ambassador_promotion(uuid) to authenticated;

-- Public profile badge: only the earned city/status is exposed.
create or replace function public.city_ambassador_badge(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select city.name
  from public.city_ambassador_rewards reward
  join public.cities city on city.id = reward.city_id
  where reward.profile_id = p_profile_id
  order by reward.earned_at asc
  limit 1;
$$;

grant execute on function public.city_ambassador_badge(uuid) to anon, authenticated;
