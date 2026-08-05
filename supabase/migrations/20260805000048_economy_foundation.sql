-- Economy foundation (TZ addendum #3, stage 1):
-- 1) gifts get a price in ⭐ and an economy flag (platform/creator);
-- 2) virtual items catalog + user inventory (bought for ⭐, no cash-out);
-- 3) VIP subscription for ⭐;
-- 4) social level computed from activity (novice → star).

-- Gifts: price in stars and economy split.
alter table public.virtual_gifts
  add column if not exists price_stars integer check (price_stars is null or price_stars > 0),
  add column if not exists economy text not null default 'creator' check (economy in ('platform', 'creator'));

update public.virtual_gifts set price_stars = price_minor / 100 where price_stars is null;

-- Digital goods catalog (100% platform revenue, bought for stars).
create table if not exists public.virtual_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('avatar_frame', 'profile_theme', 'effect', 'badge')),
  name text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 300),
  emoji text not null default '🎁',
  price_stars integer not null check (price_stars > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists virtual_items_active_idx on public.virtual_items (is_active, sort_order);

insert into public.virtual_items (item_type, name, description, emoji, price_stars, sort_order) values
  ('badge', 'Значок «Огонёк»', 'Маленький знак в профиле', '🔥', 59, 1),
  ('badge', 'Значок «Звезда»', 'Знак активного участника', '⭐', 129, 2),
  ('avatar_frame', 'Рамка «Розовая»', 'Рамка аватара', '🌸', 99, 3),
  ('avatar_frame', 'Рамка «Неон»', 'Светящаяся рамка', '💜', 199, 4),
  ('effect', 'Эффект «Блёстки»', 'Анимация в профиле', '✨', 79, 5),
  ('effect', 'Эффект «Огонь»', 'Огненная анимация', '🔥', 149, 6),
  ('profile_theme', 'Тема «Ночь»', 'Тёмное оформление профиля', '🌙', 149, 7),
  ('profile_theme', 'Тема «Космос»', 'Космическое оформление', '🚀', 249, 8)
on conflict do nothing;

-- User inventory: bought items, one item of a type can be equipped.
create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.virtual_items(id) on delete cascade,
  is_equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  unique (profile_id, item_id)
);
create index if not exists user_inventory_profile_idx on public.user_inventory (profile_id, acquired_at desc);

-- VIP subscription.
alter table public.bonus_settings
  add column if not exists vip_price_stars integer not null default 149 check (vip_price_stars > 0),
  add column if not exists vip_duration_days integer not null default 30 check (vip_duration_days > 0);

create table if not exists public.vip_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired')),
  created_at timestamptz not null default now()
);
create index if not exists vip_subscriptions_active_idx on public.vip_subscriptions (status, expires_at desc);

alter table public.virtual_items enable row level security;
alter table public.user_inventory enable row level security;
alter table public.vip_subscriptions enable row level security;

create policy "virtual items catalog readable" on public.virtual_items for select using (is_active or public.is_admin());
create policy "users see own inventory" on public.user_inventory for select using (profile_id = auth.uid() or public.is_admin());
create policy "users equip own items" on public.user_inventory for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "users see own vip" on public.vip_subscriptions for select using (profile_id = auth.uid() or public.is_admin());

-- Buy a virtual item for stars (idempotent: unique profile+item).
create or replace function public.purchase_virtual_item(p_item_id uuid)
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
  select price_stars into cost from public.virtual_items where id = p_item_id and is_active = true;
  if cost is null then raise exception 'Item not found'; end if;
  if exists (select 1 from public.user_inventory where profile_id = auth.uid() and item_id = p_item_id) then
    return false; -- already owned
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

-- Subscribe to VIP for stars (extends the current period).
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

-- Social level by activity (thresholds are tunable; money does not matter).
create or replace function public.social_level(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select count(*) from public.user_follows uf where uf.following_id = p_profile_id) >= 5000 then 'star'
    when (select count(*) from public.user_follows uf where uf.following_id = p_profile_id) >= 500 then 'author'
    when (select count(*) from public.user_follows uf where uf.following_id = p_profile_id) >= 50 then 'popular'
    when (select count(*) from public.user_follows uf where uf.following_id = p_profile_id) >= 5 then 'active'
    else 'novice'
  end;
$$;

grant execute on function public.purchase_virtual_item(uuid), public.subscribe_vip(), public.social_level(uuid) to authenticated;
