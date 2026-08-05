-- Internal «Хочу-бонусы». They are deliberately separate from cash earnings.

do $$
begin
  create type public.bonus_ledger_status as enum ('pending', 'available', 'spent', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.bonus_settings (
  id boolean primary key default true check (id),
  referral_reward integer not null default 200 check (referral_reward > 0),
  hold_days smallint not null default 0 check (hold_days between 0 and 30),
  updated_at timestamptz not null default now()
);
insert into public.bonus_settings (id, referral_reward, hold_days) values (true, 200, 0) on conflict (id) do nothing;

create table if not exists public.bonus_wallets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  available_balance integer not null default 0 check (available_balance >= 0),
  total_earned integer not null default 0 check (total_earned >= 0),
  total_spent integer not null default 0 check (total_spent >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonus_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  referral_id uuid unique references public.referrals(id) on delete cascade,
  amount integer not null check (amount <> 0),
  status public.bonus_ledger_status not null default 'pending',
  type text not null check (type in ('referral_reward', 'promotion_spend', 'manual_adjustment')),
  available_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists bonus_ledger_profile_idx on public.bonus_ledger_entries (profile_id, created_at desc);

alter table public.bonus_wallets enable row level security;
alter table public.bonus_ledger_entries enable row level security;
alter table public.bonus_settings enable row level security;

create policy "users see own bonus wallet" on public.bonus_wallets for select using (profile_id = auth.uid() or public.is_admin());
create policy "users see own bonus history" on public.bonus_ledger_entries for select using (profile_id = auth.uid() or public.is_admin());
create policy "bonus settings readable" on public.bonus_settings for select using (true);

create or replace function public.claim_referral_bonus_if_qualified()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_record public.referrals%rowtype;
  settings_record public.bonus_settings%rowtype;
  qualified boolean;
begin
  if auth.uid() is null then return false; end if;
  select * into referral_record from public.referrals where referee_id = auth.uid() and status = 'registered' for update;
  if not found then return false; end if;

  select * into settings_record from public.bonus_settings where id = true;
  select exists (select 1 from public.profiles where id = auth.uid() and onboarding_completed_at is not null)
    and (exists (select 1 from public.wishes where author_id = auth.uid()) or exists (select 1 from public.fundraisers where author_id = auth.uid() and status in ('active', 'goal_reached')))
  into qualified;
  if not qualified then return false; end if;

  update public.referrals set status = case when settings_record.hold_days = 0 then 'approved' else 'held' end,
    qualified_at = now(), hold_until = now() + make_interval(days => settings_record.hold_days),
    approved_at = case when settings_record.hold_days = 0 then now() else null end
  where id = referral_record.id;

  insert into public.bonus_ledger_entries (profile_id, referral_id, amount, status, type, available_at, metadata)
  values (referral_record.referrer_id, referral_record.id, settings_record.referral_reward,
    case when settings_record.hold_days = 0 then 'available' else 'pending' end,
    'referral_reward', case when settings_record.hold_days = 0 then now() else now() + make_interval(days => settings_record.hold_days) end,
    jsonb_build_object('referee_id', auth.uid()))
  on conflict (referral_id) do nothing;

  if settings_record.hold_days = 0 then
    insert into public.bonus_wallets (profile_id, available_balance, total_earned)
    values (referral_record.referrer_id, settings_record.referral_reward, settings_record.referral_reward)
    on conflict (profile_id) do update set available_balance = bonus_wallets.available_balance + excluded.available_balance,
      total_earned = bonus_wallets.total_earned + excluded.total_earned, updated_at = now();
  end if;

  return true;
end;
$$;

grant execute on function public.claim_referral_bonus_if_qualified() to authenticated;
