-- Daily quests + signup bonus (PM P1-4): keep the star economy alive in an
-- empty city. Referrals alone cannot fund gifts — a person with no friends
-- should still be able to send one. Daily quests give a small recurring
-- income, and the signup bonus gives the very first gift in the pocket.
--
-- Anti-abuse: quest rewards are read from `daily_quests` (RLS write-locked,
-- admins only), completions are unique per (profile, quest, day) and the
-- wallet is only credited when the completion row was actually inserted.
-- The signup bonus is idempotent via the ledger's unique signup_bonus row.

alter table public.bonus_settings
  add column if not exists signup_bonus integer not null default 100 check (signup_bonus >= 0);

create table if not exists public.daily_quests (
  slug text primary key check (slug ~ '^[a-z0-9_]{2,60}$'),
  title text not null,
  description text,
  reward integer not null check (reward > 0),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_quest_completions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  quest_slug text not null references public.daily_quests(slug) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (profile_id, quest_slug, completed_on)
);

insert into public.daily_quests (slug, title, description, reward, sort_order) values
  ('daily_login', 'Заглянуть в город', 'Открой приложение — город ждёт', 5, 1),
  ('daily_story_reaction', 'Отреагировать на story', 'Поддержи чей-то момент', 10, 2),
  ('daily_place_message', 'Написать в место', 'Оставь сообщение в месте города', 10, 3),
  ('daily_wish_support', 'Поддержать желание', 'Нажми «Хочу также» под желанием', 10, 4)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  reward = excluded.reward,
  sort_order = excluded.sort_order,
  is_active = true;

alter table public.bonus_ledger_entries
  drop constraint if exists bonus_ledger_entries_type_check;

alter table public.bonus_ledger_entries
  add constraint bonus_ledger_entries_type_check
  check (type in ('referral_reward', 'promotion_spend', 'manual_adjustment', 'daily_quest', 'signup_bonus'));

alter table public.daily_quests enable row level security;
alter table public.daily_quest_completions enable row level security;

create policy "daily quests readable" on public.daily_quests for select using (true);
create policy "daily quests admin write" on public.daily_quests for all using (public.is_admin()) with check (public.is_admin());
create policy "users see own completions" on public.daily_quest_completions for select using (profile_id = auth.uid() or public.is_admin());
create policy "completions inserted by function only" on public.daily_quest_completions for insert with check (profile_id = auth.uid());

-- Complete a daily quest: idempotent per day, credits the wallet only once.
create or replace function public.complete_daily_quest(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward integer;
  v_inserted boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('completed', false, 'reward', 0);
  end if;

  select reward into v_reward
  from public.daily_quests
  where slug = p_slug and is_active = true;

  if v_reward is null then
    return jsonb_build_object('completed', false, 'reward', 0);
  end if;

  insert into public.daily_quest_completions (profile_id, quest_slug)
  values (auth.uid(), p_slug)
  on conflict (profile_id, quest_slug, completed_on) do nothing
  returning true into v_inserted;

  if v_inserted is null then
    -- Already completed today.
    return jsonb_build_object('completed', false, 'reward', 0, 'already', true);
  end if;

  insert into public.bonus_ledger_entries (profile_id, amount, status, type, available_at, metadata)
  values (auth.uid(), v_reward, 'available', 'daily_quest',
    now(), jsonb_build_object('quest', p_slug));

  insert into public.bonus_wallets (profile_id, available_balance, total_earned)
  values (auth.uid(), v_reward, v_reward)
  on conflict (profile_id) do update set
    available_balance = bonus_wallets.available_balance + excluded.available_balance,
    total_earned = bonus_wallets.total_earned + excluded.total_earned,
    updated_at = now();

  return jsonb_build_object('completed', true, 'reward', v_reward);
end;
$$;

-- Today's progress for the bonuses screen: slug -> done.
create or replace function public.daily_quest_progress()
returns table (quest_slug text, completed_on date)
language sql
stable
security definer
set search_path = public
as $$
  select c.quest_slug, c.completed_on
  from public.daily_quest_completions c
  where c.profile_id = auth.uid()
    and c.completed_on = current_date;
$$;

-- Idempotent signup bonus: exactly one per profile, forever.
create or replace function public.claim_signup_bonus()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount integer;
  v_exists uuid;
begin
  if auth.uid() is null then return false; end if;

  select id into v_exists
  from public.bonus_ledger_entries
  where profile_id = auth.uid() and type = 'signup_bonus'
  limit 1;

  if v_exists is not null then
    return false;
  end if;

  select signup_bonus into v_amount from public.bonus_settings where id = true;
  if v_amount is null or v_amount <= 0 then
    return false;
  end if;

  insert into public.bonus_ledger_entries (profile_id, amount, status, type, available_at, metadata)
  values (auth.uid(), v_amount, 'available', 'signup_bonus', now(), '{}'::jsonb);

  insert into public.bonus_wallets (profile_id, available_balance, total_earned)
  values (auth.uid(), v_amount, v_amount)
  on conflict (profile_id) do update set
    available_balance = bonus_wallets.available_balance + excluded.available_balance,
    total_earned = bonus_wallets.total_earned + excluded.total_earned,
    updated_at = now();

  return true;
end;
$$;

grant execute on function public.complete_daily_quest(text) to authenticated;
grant execute on function public.daily_quest_progress() to authenticated;
grant execute on function public.claim_signup_bonus() to authenticated;
