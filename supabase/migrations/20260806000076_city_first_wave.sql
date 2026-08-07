-- City First Wave (City Invitation / First Wave v2): an earned, collective
-- milestone for a city — reached when N real, qualified referrals live in
-- the same city as their referrer. It is activity-based, anonymous (no PII
-- is exposed), never purchasable, and the reward is ⭐ only (internal bonus,
-- no real money, no payouts). Milestones: 5 / 15 / 30 qualified residents.

create table if not exists public.city_first_waves (
  city_id uuid not null references public.cities(id) on delete cascade,
  milestone integer not null check (milestone in (5, 15, 30)),
  qualified_referrals integer not null check (qualified_referrals >= milestone),
  unlocked_by uuid references public.profiles(id) on delete set null,
  achieved_at timestamptz not null default now(),
  primary key (city_id, milestone)
);

alter table public.city_first_waves enable row level security;
create policy "city first waves readable"
  on public.city_first_waves for select using (true);

-- Extend the internal bonus ledger with the first-wave reward type.
alter table public.bonus_ledger_entries
  drop constraint if exists bonus_ledger_entries_type_check;
alter table public.bonus_ledger_entries
  add constraint bonus_ledger_entries_type_check
  check (type in (
    'referral_reward', 'promotion_spend', 'manual_adjustment', 'item_purchase',
    'vip_purchase', 'gift_purchase', 'place_style', 'collectible_purchase',
    'city_first_wave'
  ));

-- Award milestones for a city. Idempotent: a milestone is inserted only once
-- (primary key), and the ⭐ bonus is granted only when the insert actually
-- happened — the person whose referral closed the milestone receives it.
create or replace function public.award_city_first_wave(p_city_id uuid, p_unlocked_by uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_milestone integer;
  v_bonus integer;
  v_inserted uuid;
begin
  if p_city_id is null then return false; end if;

  select count(*) into v_count
  from public.referrals r
  join public.profiles referrer on referrer.id = r.referrer_id
  join public.profiles invited on invited.id = r.referee_id
  where referrer.city_id = p_city_id
    and invited.city_id = p_city_id
    and r.status in ('qualified', 'held', 'approved');

  for v_milestone in
    select milestone from (values (5), (15), (30)) as t(milestone)
  loop
    if v_count >= v_milestone then
      insert into public.city_first_waves (city_id, milestone, qualified_referrals, unlocked_by)
      values (p_city_id, v_milestone, v_count, p_unlocked_by)
      on conflict (city_id, milestone) do nothing
      returning id into v_inserted;

      if v_inserted is not null and p_unlocked_by is not null then
        v_bonus := case v_milestone when 5 then 100 when 15 then 250 else 500 end;

        insert into public.bonus_ledger_entries
          (profile_id, amount, status, type, available_at, metadata)
        values (
          p_unlocked_by, v_bonus, 'available', 'city_first_wave', now(),
          jsonb_build_object('city_id', p_city_id, 'milestone', v_milestone)
        );

        insert into public.bonus_wallets (profile_id, available_balance, total_earned)
        values (p_unlocked_by, v_bonus, v_bonus)
        on conflict (profile_id) do update set
          available_balance = bonus_wallets.available_balance + excluded.available_balance,
          total_earned = bonus_wallets.total_earned + excluded.total_earned,
          updated_at = now();
      end if;
    end if;
  end loop;

  return true;
end;
$$;

-- Trigger: evaluate the city first wave every time a referral becomes
-- qualified (the same moment the referrer's bonus is unlocked).
create or replace function public.city_first_wave_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_city uuid;
  v_referee_city uuid;
begin
  if new.status in ('qualified', 'held', 'approved') then
    select city_id into v_referrer_city from public.profiles where id = new.referrer_id;
    select city_id into v_referee_city from public.profiles where id = new.referee_id;
    if v_referrer_city is not null and v_referrer_city = v_referee_city then
      perform public.award_city_first_wave(v_referrer_city, new.referrer_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists city_first_wave_trigger_trg on public.referrals;
create trigger city_first_wave_trigger_trg
  after insert or update of status on public.referrals
  for each row execute function public.city_first_wave_trigger();

-- Anonymous progress for the UI: the caller's city, current qualified count,
-- next milestone and already achieved milestones. No names, no emails.
create or replace function public.city_first_wave_progress()
returns table (
  city_id uuid,
  city_name text,
  qualified_referrals integer,
  next_milestone integer,
  achieved_milestones integer[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    owner.city_id,
    city.name,
    (
      select count(*)::integer
      from public.referrals r
      join public.profiles referrer on referrer.id = r.referrer_id
      join public.profiles invited on invited.id = r.referee_id
      where referrer.city_id = owner.city_id
        and invited.city_id = owner.city_id
        and r.status in ('qualified', 'held', 'approved')
    ) as qualified_referrals,
    (
      select min(milestone)
      from (values (5), (15), (30)) as m(milestone)
      where milestone not in (
        select fw.milestone from public.city_first_waves fw where fw.city_id = owner.city_id
      )
    ) as next_milestone,
    (
      select coalesce(array_agg(fw.milestone order by fw.milestone), '{}')
      from public.city_first_waves fw where fw.city_id = owner.city_id
    ) as achieved_milestones
  from public.profiles owner
  left join public.cities city on city.id = owner.city_id
  where owner.id = auth.uid();
$$;

grant execute on function public.award_city_first_wave(uuid, uuid) to authenticated;
grant execute on function public.city_first_wave_progress() to authenticated;
