-- Star economy anti-abuse (TZ addendum #3, section 16):
-- daily spend limit per user and a hard cap on referral rewards per day.
-- Pure platform-safety settings; no refunds (stars are internal currency).

alter table public.bonus_settings
  add column if not exists daily_spend_limit integer not null default 2000 check (daily_spend_limit > 0),
  add column if not exists referral_daily_cap integer not null default 1000 check (referral_daily_cap > 0);

-- Daily spend guard: returns the already spent stars today and the limit.
create or replace function public.star_spend_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_spent_today integer;
begin
  select daily_spend_limit into v_limit from public.bonus_settings where id = true;
  select coalesce(sum(-amount), 0) into v_spent_today
  from public.bonus_ledger_entries
  where profile_id = auth.uid() and amount < 0 and created_at >= date_trunc('day', now());
  return jsonb_build_object('limit', v_limit, 'spent_today', v_spent_today);
end;
$$;

-- Shared guard used by every spend function.
create or replace function public.guard_daily_spend(p_cost integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_spent_today integer;
begin
  select daily_spend_limit into v_limit from public.bonus_settings where id = true;
  select coalesce(sum(-amount), 0) into v_spent_today
  from public.bonus_ledger_entries
  where profile_id = auth.uid() and amount < 0 and created_at >= date_trunc('day', now());
  if v_spent_today + p_cost > v_limit then
    raise exception 'Daily spend limit exceeded';
  end if;
end;
$$;

grant execute on function public.star_spend_state() to authenticated;

-- Guard the daily referral reward cap (per referrer).
create or replace function public.guard_referral_daily_cap(p_reward integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cap integer;
  v_rewarded_today integer;
begin
  select referral_daily_cap into v_cap from public.bonus_settings where id = true;
  select coalesce(sum(amount), 0) into v_rewarded_today
  from public.bonus_ledger_entries
  where profile_id = auth.uid() and type = 'referral_reward' and amount > 0 and created_at >= date_trunc('day', now());
  if v_rewarded_today + p_reward > v_cap then
    raise exception 'Daily referral cap exceeded';
  end if;
end;
$$;

-- Purchase: enforce the daily spend limit.
create or replace function public.purchase_virtual_item(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
  remaining integer;
  vip_only boolean;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select price_stars, remaining_edition, requires_vip into cost, remaining, vip_only
  from public.virtual_items where id = p_item_id and is_active = true;
  if cost is null then raise exception 'Item not found'; end if;

  if vip_only and not exists (
    select 1 from public.vip_subscriptions
    where profile_id = auth.uid() and status = 'active' and expires_at > now()
  ) then
    raise exception 'VIP required';
  end if;

  if exists (select 1 from public.user_inventory where profile_id = auth.uid() and item_id = p_item_id) then
    return false; -- already owned
  end if;

  if remaining is not null then
    update public.virtual_items
    set remaining_edition = remaining_edition - 1
    where id = p_item_id and remaining_edition > 0
    returning remaining_edition into remaining;
    if remaining is null then raise exception 'Edition exhausted'; end if;
  end if;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'item_purchase', jsonb_build_object('item_id', p_item_id));
  insert into public.user_inventory (profile_id, item_id) values (auth.uid(), p_item_id);
  return true;
end;
$$;

-- VIP subscribe: enforce the daily spend limit.
create or replace function public.subscribe_vip()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  days integer;
  balance integer;
  ends_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select vip_price_stars, vip_duration_days into cost, days from public.bonus_settings where id = true;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  ends_at := greatest(coalesce((select expires_at from public.vip_subscriptions where profile_id = auth.uid()), now()), now()) + make_interval(days => days);

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'vip_purchase', jsonb_build_object('expires_at', ends_at));
  insert into public.vip_subscriptions (profile_id, started_at, expires_at, status)
  values (auth.uid(), now(), ends_at, 'active')
  on conflict (profile_id) do update set expires_at = excluded.expires_at, status = 'active', started_at = now();
  return ends_at;
end;
$$;

-- Profile gift: enforce the daily spend limit.
create or replace function public.send_profile_gift(p_recipient_id uuid, p_gift_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
  vip_only boolean;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if p_recipient_id = auth.uid() then raise exception 'Cannot gift yourself'; end if;
  select price_stars, requires_vip into cost, vip_only from public.virtual_gifts
  where code = p_gift_code and is_active = true and price_stars is not null;
  if cost is null then raise exception 'Gift not found'; end if;

  if vip_only and not exists (
    select 1 from public.vip_subscriptions
    where profile_id = auth.uid() and status = 'active' and expires_at > now()
  ) then
    raise exception 'VIP required';
  end if;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'gift_purchase', jsonb_build_object('recipient_id', p_recipient_id, 'gift_code', p_gift_code));
  insert into public.profile_gifts (sender_id, recipient_id, gift_code, price_stars)
  values (auth.uid(), p_recipient_id, p_gift_code, cost);
  return true;
end;
$$;

-- Promotions: enforce the daily spend limit.
create or replace function public.promote_with_hocu_bonus(
  p_target text,
  p_target_id uuid
)
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

  if p_target = 'profile' then
    if p_target_id <> auth.uid() then raise exception 'Only your own profile can be promoted'; end if;
    select profile_promotion_cost into cost from public.bonus_settings where id = true;
  elsif p_target = 'live' then
    if not exists (select 1 from public.live_rooms where id = p_target_id and host_id = auth.uid()) then
      raise exception 'Only the host can promote the live';
    end if;
    select live_promotion_cost into cost from public.bonus_settings where id = true;
  elsif p_target = 'event' then
    if not exists (select 1 from public.events where id = p_target_id and author_id = auth.uid()) then
      raise exception 'Only the author can promote the event';
    end if;
    select event_promotion_cost into cost from public.bonus_settings where id = true;
  else
    raise exception 'Unknown target';
  end if;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  if p_target = 'profile' then
    ends_at := greatest(coalesce((select promoted_until from public.profiles where id = p_target_id), now()), now()) + interval '24 hours';
    update public.profiles set promoted_until = ends_at where id = p_target_id;
    insert into public.profile_promotions (profile_id, cost_bonus, expires_at) values (p_target_id, cost, ends_at);
  elsif p_target = 'live' then
    ends_at := greatest(coalesce((select promoted_until from public.live_rooms where id = p_target_id), now()), now()) + interval '6 hours';
    update public.live_rooms set promoted_until = ends_at where id = p_target_id;
    insert into public.live_promotions (live_room_id, profile_id, cost_bonus, expires_at) values (p_target_id, auth.uid(), cost, ends_at);
  else
    ends_at := greatest(coalesce((select promoted_until from public.events where id = p_target_id), now()), now()) + interval '24 hours';
    update public.events set promoted_until = ends_at where id = p_target_id;
    insert into public.event_promotions (event_id, profile_id, cost_bonus, expires_at) values (p_target_id, auth.uid(), cost, ends_at);
  end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'promotion_spend', jsonb_build_object('target', p_target, 'target_id', p_target_id, 'expires_at', ends_at));
  return ends_at;
end;
$$;

-- Place boost / pin / styling: enforce the daily spend limit.
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
  if not exists (select 1 from public.places where id = p_place_id and creator_id = auth.uid() and is_active = true) then
    raise exception 'Only the creator can promote an active place';
  end if;
  select place_promotion_cost into cost from public.bonus_settings where id = true;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
  ends_at := greatest(coalesce((select promoted_until from public.places where id = p_place_id), now()), now()) + interval '24 hours';

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'promotion_spend', jsonb_build_object('place_id', p_place_id, 'expires_at', ends_at));
  update public.places set promoted_until = ends_at where id = p_place_id;
  insert into public.place_promotions (place_id, profile_id, cost_bonus, expires_at) values (p_place_id, auth.uid(), cost, ends_at);
  return ends_at;
end;
$$;

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
  if not exists (select 1 from public.places where id = p_place_id and creator_id = auth.uid() and is_active = true) then
    raise exception 'Only the creator can pin an active place';
  end if;
  select place_pin_cost into cost from public.bonus_settings where id = true;

  perform public.guard_daily_spend(cost);

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

create or replace function public.buy_place_theme(p_place_id uuid, p_theme_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if not exists (select 1 from public.places where id = p_place_id and creator_id = auth.uid() and is_active = true) then
    raise exception 'Only the creator can style the place';
  end if;
  select price_stars into cost from public.place_themes where id = p_theme_id and is_active = true;
  if cost is null then raise exception 'Theme not found'; end if;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'place_style', jsonb_build_object('place_id', p_place_id, 'theme_id', p_theme_id));
  update public.places set theme_id = p_theme_id where id = p_place_id;
  return true;
end;
$$;

create or replace function public.buy_place_emblem(p_place_id uuid, p_emblem_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if not exists (select 1 from public.places where id = p_place_id and creator_id = auth.uid() and is_active = true) then
    raise exception 'Only the creator can style the place';
  end if;
  select price_stars into cost from public.place_emblems where id = p_emblem_id and is_active = true;
  if cost is null then raise exception 'Emblem not found'; end if;

  perform public.guard_daily_spend(cost);

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'place_style', jsonb_build_object('place_id', p_place_id, 'emblem_id', p_emblem_id));
  update public.places set emblem_id = p_emblem_id where id = p_place_id;
  return true;
end;
$$;

-- Referral claim: enforce the daily cap on rewards.
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

  -- Anti-abuse: the referrer cannot exceed the daily referral cap.
  perform public.guard_referral_daily_cap(settings_record.referral_reward);

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
