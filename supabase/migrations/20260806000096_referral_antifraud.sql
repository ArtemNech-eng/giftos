-- Referral anti-fraud (PM P0-3): record the registration IP at onboarding
-- and refuse referral rewards for self-invites.
--   1) same_ip_self_invite — referrer and referee onboarded from the same IP
--      (almost always the same person with a second email);
--   2) ip_cascade — more than one already-rewarded referee shares the IP
--      (farming chains: one person inviting themselves several times).
-- The referral is marked 'rejected' with a human-readable rejection_reason
-- so a moderator can see and manually fix a false positive.

alter table public.profiles
  add column if not exists registration_ip inet;

create index if not exists profiles_registration_ip_idx
  on public.profiles (registration_ip) where registration_ip is not null;

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
  v_referee_ip inet;
  v_referrer_ip inet;
  v_rewarded_same_ip integer;
begin
  if auth.uid() is null then return false; end if;
  select * into referral_record from public.referrals where referee_id = auth.uid() and status = 'registered' for update;
  if not found then return false; end if;

  select * into settings_record from public.bonus_settings where id = true;
  select exists (select 1 from public.profiles where id = auth.uid() and onboarding_completed_at is not null)
    and (exists (select 1 from public.wishes where author_id = auth.uid()) or exists (select 1 from public.fundraisers where author_id = auth.uid() and status in ('active', 'goal_reached')))
  into qualified;
  if not qualified then return false; end if;

  -- Anti-abuse #1: daily cap on the referrer.
  perform public.guard_referral_daily_cap(settings_record.referral_reward);

  -- Anti-abuse #2: self-invite — the referee onboarded from the same IP as
  -- the referrer (two accounts, one person).
  select registration_ip into v_referee_ip
  from public.profiles where id = referral_record.referee_id;
  select registration_ip into v_referrer_ip
  from public.profiles where id = referral_record.referrer_id;

  if v_referee_ip is not null and v_referee_ip = v_referrer_ip then
    update public.referrals set status = 'rejected',
      rejection_reason = 'same_ip_self_invite'
    where id = referral_record.id;
    return false;
  end if;

  -- Anti-abuse #3: IP cascade — two or more people already rewarded from
  -- this IP. One device, several emails, several rewards.
  if v_referee_ip is not null then
    select count(*) into v_rewarded_same_ip
    from public.referrals r
    join public.profiles p on p.id = r.referee_id
    where p.registration_ip = v_referee_ip
      and r.status in ('qualified', 'held', 'approved')
      and r.referee_id <> referral_record.referee_id;

    if v_rewarded_same_ip >= 2 then
      update public.referrals set status = 'rejected',
        rejection_reason = 'ip_cascade'
      where id = referral_record.id;
      return false;
    end if;
  end if;

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
