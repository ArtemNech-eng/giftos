-- Collection v1: limited game artifacts bought with ⭐ and gifted on profiles.
-- This is a platform collectible layer, not an NFT, investment, marketplace or
-- creator payout. It stays in test-mode until the self-hosted QA gate is done.

create table if not exists public.collectible_artifact_series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  title text not null check (char_length(title) between 1 and 60),
  description text check (description is null or char_length(description) <= 240),
  artwork_path text not null check (char_length(artwork_path) <= 240),
  rarity text not null check (rarity in ('limited', 'rare', 'iconic')),
  total_edition integer not null check (total_edition > 0 and total_edition <= 10000),
  remaining_edition integer not null check (remaining_edition >= 0 and remaining_edition <= total_edition),
  price_stars integer not null check (price_stars > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists collectible_artifact_series_active_idx
  on public.collectible_artifact_series (is_active, sort_order);

create table if not exists public.collectible_artifact_instances (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.collectible_artifact_series(id) on delete restrict,
  serial_number integer not null check (serial_number > 0),
  sender_id uuid not null references public.profiles(id) on delete restrict,
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  display_on_profile boolean not null default true,
  sender_visibility boolean not null default false,
  issued_at timestamptz not null default now(),
  unique (series_id, serial_number)
);
create index if not exists collectible_artifact_instances_recipient_idx
  on public.collectible_artifact_instances (recipient_id, issued_at desc);
create index if not exists collectible_artifact_instances_sender_idx
  on public.collectible_artifact_instances (sender_id, issued_at desc);

alter table public.collectible_artifact_series enable row level security;
alter table public.collectible_artifact_instances enable row level security;

create policy "active collectible series readable" on public.collectible_artifact_series
  for select using (is_active or public.is_admin());
create policy "participants read own collectible artifacts" on public.collectible_artifact_instances
  for select using (recipient_id = auth.uid() or sender_id = auth.uid() or public.is_admin());
create policy "recipient controls collectible display" on public.collectible_artifact_instances
  for update using (recipient_id = auth.uid() or public.is_admin())
  with check (recipient_id = auth.uid() or public.is_admin());

-- Public collection shelf intentionally excludes the sender identity. Display is
-- opted in by the recipient and is available only on public profiles.
create or replace view public.public_collectible_artifact_shelf
with (security_invoker = false)
as
select
  instance.id,
  instance.recipient_id,
  instance.series_id,
  instance.serial_number,
  instance.issued_at,
  series.slug as series_slug,
  series.title,
  series.artwork_path,
  series.rarity,
  series.total_edition
from public.collectible_artifact_instances instance
join public.collectible_artifact_series series on series.id = instance.series_id
join public.profiles recipient on recipient.id = instance.recipient_id
where instance.display_on_profile = true
  and recipient.profile_visibility = 'public'
  and recipient.is_suspended = false;

grant select on public.public_collectible_artifact_shelf to anon, authenticated;

-- First visual drop. Art is synthetic pre-production material and must be
-- replaced by commissioned/licensed final art before a public paid release.
insert into public.collectible_artifact_series
  (slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars, sort_order)
values
  ('key', 'Ключ', 'Первый предмет серии ARTIFACTS 01.', '/collectibles/artifacts/key.jpg', 'limited', 300, 300, 39, 1),
  ('relic', 'Реликвия', 'Огранённый предмет с красным ядром.', '/collectibles/artifacts/relic.jpg', 'limited', 250, 250, 59, 2),
  ('compass', 'Компас', 'Предмет для тех, кто ищет своё направление.', '/collectibles/artifacts/compass.jpg', 'limited', 200, 200, 79, 3),
  ('cube', 'Куб', 'Механический артефакт с внутренним светом.', '/collectibles/artifacts/cube.jpg', 'limited', 175, 175, 99, 4),
  ('lantern', 'Фонарь', 'Светящийся предмет из первой десятки.', '/collectibles/artifacts/lantern.jpg', 'limited', 150, 150, 119, 5),
  ('prism', 'Призма', 'Редкая грань серии.', '/collectibles/artifacts/prism.jpg', 'rare', 100, 100, 149, 6),
  ('vial', 'Флакон', 'Редкий закрытый артефакт.', '/collectibles/artifacts/vial.jpg', 'rare', 80, 80, 179, 7),
  ('seal', 'Печать', 'Знак принадлежности к первой серии.', '/collectibles/artifacts/seal.jpg', 'rare', 60, 60, 219, 8),
  ('sphere', 'Сфера', 'Прозрачный редкий предмет.', '/collectibles/artifacts/sphere.jpg', 'iconic', 40, 40, 269, 9),
  ('orbit', 'Орбита', 'Самый ограниченный предмет первой десятки.', '/collectibles/artifacts/orbit.jpg', 'iconic', 25, 25, 349, 10)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  artwork_path = excluded.artwork_path,
  rarity = excluded.rarity,
  total_edition = excluded.total_edition,
  price_stars = excluded.price_stars,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.bonus_ledger_entries
  drop constraint if exists bonus_ledger_entries_type_check;
alter table public.bonus_ledger_entries
  add constraint bonus_ledger_entries_type_check
  check (type in (
    'referral_reward', 'promotion_spend', 'manual_adjustment', 'item_purchase',
    'vip_purchase', 'gift_purchase', 'place_style', 'collectible_purchase'
  ));

-- The serial allocation and ⭐ charge happen in one transaction. A second buyer
-- cannot receive the same serial and sold-out series cannot go below zero.
create or replace function public.send_collectible_artifact(
  p_recipient_id uuid,
  p_series_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost integer;
  v_total integer;
  v_remaining integer;
  v_serial integer;
  v_balance integer;
  v_instance_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if p_recipient_id = auth.uid() then raise exception 'Cannot gift yourself'; end if;

  if not exists (
    select 1 from public.profiles
    where id = p_recipient_id
      and profile_visibility = 'public'
      and is_suspended = false
  ) then
    raise exception 'Recipient is unavailable';
  end if;

  select price_stars, total_edition, remaining_edition
    into v_cost, v_total, v_remaining
  from public.collectible_artifact_series
  where id = p_series_id and is_active = true
  for update;
  if v_cost is null then raise exception 'Collectible not found'; end if;
  if v_remaining <= 0 then raise exception 'Edition exhausted'; end if;

  perform public.guard_daily_spend(v_cost);

  select available_balance into v_balance
  from public.bonus_wallets
  where profile_id = auth.uid()
  for update;
  if coalesce(v_balance, 0) < v_cost then raise exception 'Insufficient bonus balance'; end if;

  update public.collectible_artifact_series
  set remaining_edition = remaining_edition - 1,
      updated_at = now()
  where id = p_series_id and remaining_edition > 0
  returning total_edition - remaining_edition into v_serial;
  if v_serial is null then raise exception 'Edition exhausted'; end if;

  update public.bonus_wallets
  set available_balance = available_balance - v_cost,
      total_spent = total_spent + v_cost,
      updated_at = now()
  where profile_id = auth.uid();

  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (
    auth.uid(),
    -v_cost,
    'spent',
    'collectible_purchase',
    jsonb_build_object('recipient_id', p_recipient_id, 'series_id', p_series_id, 'serial_number', v_serial)
  );

  insert into public.collectible_artifact_instances
    (series_id, serial_number, sender_id, recipient_id)
  values
    (p_series_id, v_serial, auth.uid(), p_recipient_id)
  returning id into v_instance_id;

  return v_instance_id;
end;
$$;

grant execute on function public.send_collectible_artifact(uuid, uuid) to authenticated;
