-- Starter quest «Первые шаги в городе» (PM P1-5): a one-time 5-step path
-- for new residents — profile → wish → story → place activity → invite.
-- Progress is computed from real data (no new tracking), rewards are
-- claimed idempotently and only when the step is genuinely done, so a
-- fresh account without a single action earns nothing.
--
-- Rewards live in bonus_settings.starter_quest_rewards (jsonb) so they can
-- be tuned without a migration.

alter table public.bonus_settings
  add column if not exists starter_quest_rewards jsonb not null default
    '{"profile_done":50,"wish_created":100,"story_published":150,"place_activity":200,"friend_invited":300}';

create table if not exists public.starter_quest_completions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  step text not null check (step in ('profile_done', 'wish_created', 'story_published', 'place_activity', 'friend_invited')),
  completed_at timestamptz not null default now(),
  primary key (profile_id, step)
);

alter table public.bonus_ledger_entries
  drop constraint if exists bonus_ledger_entries_type_check;

alter table public.bonus_ledger_entries
  add constraint bonus_ledger_entries_type_check
  check (type in ('referral_reward', 'promotion_spend', 'manual_adjustment', 'daily_quest', 'signup_bonus', 'starter_quest'));

alter table public.starter_quest_completions enable row level security;

create policy "users see own starter completions" on public.starter_quest_completions
  for select using (profile_id = auth.uid() or public.is_admin());

-- Is the step genuinely done? (security definer: reads own data only).
create or replace function public.starter_step_done(p_step text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_step
    when 'profile_done' then
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.onboarding_completed_at is not null)
    when 'wish_created' then
      exists (select 1 from public.wishes w where w.author_id = auth.uid())
    when 'story_published' then
      exists (select 1 from public.stories s where s.author_id = auth.uid())
    when 'place_activity' then
      exists (select 1 from public.place_messages m where m.author_id = auth.uid())
    when 'friend_invited' then
      exists (select 1 from public.referrals r where r.referrer_id = auth.uid())
    else false
  end;
$$;

-- Claim every done-and-unclaimed step; returns the full current state:
-- { step: { done, claimed, reward } }.
create or replace function public.claim_starter_steps()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rewards jsonb;
  v_reward integer;
  v_done boolean;
  v_claimed boolean;
  v_result jsonb := '{}'::jsonb;
  v_step text;
begin
  if auth.uid() is null then
    return '{}'::jsonb;
  end if;

  select starter_quest_rewards into v_rewards from public.bonus_settings where id = true;

  for v_step in select unnest(array['profile_done', 'wish_created', 'story_published', 'place_activity', 'friend_invited'])
  loop
    v_done := public.starter_step_done(v_step);
    v_claimed := exists (
      select 1 from public.starter_quest_completions c
      where c.profile_id = auth.uid() and c.step = v_step
    );
    v_reward := coalesce((v_rewards -> v_step)::int, 0);

    if v_done and not v_claimed and v_reward > 0 then
      insert into public.starter_quest_completions (profile_id, step)
      values (auth.uid(), v_step);

      insert into public.bonus_ledger_entries (profile_id, amount, status, type, available_at, metadata)
      values (auth.uid(), v_reward, 'available', 'starter_quest', now(),
        jsonb_build_object('step', v_step));

      insert into public.bonus_wallets (profile_id, available_balance, total_earned)
      values (auth.uid(), v_reward, v_reward)
      on conflict (profile_id) do update set
        available_balance = bonus_wallets.available_balance + excluded.available_balance,
        total_earned = bonus_wallets.total_earned + excluded.total_earned,
        updated_at = now();

      v_claimed := true;
    end if;

    v_result := jsonb_set(v_result, array[v_step],
      jsonb_build_object('done', v_done, 'claimed', v_claimed, 'reward', v_reward));
  end loop;

  return v_result;
end;
$$;

grant execute on function public.claim_starter_steps() to authenticated;
