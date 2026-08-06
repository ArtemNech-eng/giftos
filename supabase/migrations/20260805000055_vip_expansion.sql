-- VIP expansion (TZ addendum #3, section 8):
-- 1) exclusive items in the shop only for VIP;
-- 2) an exclusive VIP gift in the catalog;
-- 3) VIP visibility boost in city people lists.

alter table public.virtual_items
  add column if not exists requires_vip boolean not null default false;

insert into public.virtual_items (item_type, name, description, emoji, price_stars, sort_order, requires_vip) values
  ('badge', 'Значок «Корона»', 'Эксклюзивный значок для VIP', '👑', 99, 30, true),
  ('avatar_frame', 'Рамка «VIP»', 'Премиальная рамка аватара', '💎', 299, 31, true),
  ('effect', 'Эффект «Золотой дождь»', 'Эксклюзивный эффект для VIP', '🌠', 199, 32, true)
on conflict do nothing;

-- Exclusive gift for VIP buyers (platform economy).
insert into public.virtual_gifts (code, label, emoji, price_minor, sort_order, price_stars, economy, requires_vip) values
  ('crown', 'Корона', '👑', 9900, 5, 99, 'platform', true)
on conflict (code) do nothing;

alter table public.virtual_gifts
  add column if not exists requires_vip boolean not null default false;

-- Purchase still respects the VIP gate (checked in the app too).
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

  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'item_purchase', jsonb_build_object('item_id', p_item_id));
  insert into public.user_inventory (profile_id, item_id) values (auth.uid(), p_item_id);
  return true;
end;
$$;

-- Exclusive gift sending respects the VIP gate.
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

-- VIP visibility: show active VIP members first in city people lists.
create or replace view public.public_city_people
with (security_invoker = false)
as
select
  p.id,
  p.username::text as username,
  p.display_name,
  p.avatar_path,
  p.city,
  p.is_creator,
  p.city_id,
  (select count(*) from public.user_follows uf where uf.following_id = p.id) as followers,
  exists (
    select 1 from public.vip_subscriptions vs
    where vs.profile_id = p.id and vs.status = 'active' and vs.expires_at > now()
  ) as is_vip
from public.profiles p
where p.show_city = true
  and p.profile_visibility = 'public'
  and p.is_suspended = false
order by is_vip desc, followers desc
limit 200;

grant select on public.public_city_people to anon, authenticated;
