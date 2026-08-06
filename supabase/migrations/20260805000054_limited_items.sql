-- Collectible / limited items (TZ addendum #3, section 5):
-- items with a limited print run. The purchase function decrements the
-- remaining count atomically; when exhausted the item is hidden.

alter table public.virtual_items
  add column if not exists is_limited boolean not null default false,
  add column if not exists total_edition integer check (total_edition is null or total_edition > 0),
  add column if not exists remaining_edition integer check (remaining_edition is null or remaining_edition >= 0);

-- Collectible series.
insert into public.virtual_items (item_type, name, description, emoji, price_stars, sort_order, is_limited, total_edition, remaining_edition) values
  ('badge', 'Значок «Первая волна»', 'Лимитированная серия: только для первых жителей', '🌊', 499, 20, true, 100, 100),
  ('avatar_frame', 'Рамка «Золото»', 'Редкая золотая рамка, выпуск ограничен', '🏅', 799, 21, true, 50, 50),
  ('effect', 'Эффект «Радуга»', 'Эксклюзивный эффект коллекции', '🌈', 599, 22, true, 75, 75)
on conflict do nothing;

-- Replace the purchase function: atomically decrement the edition and block
-- the purchase when the run is exhausted.
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
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select price_stars, remaining_edition into cost, remaining
  from public.virtual_items where id = p_item_id and is_active = true;
  if cost is null then raise exception 'Item not found'; end if;

  if exists (select 1 from public.user_inventory where profile_id = auth.uid() and item_id = p_item_id) then
    return false; -- already owned
  end if;

  -- Limited items: try to consume one unit atomically.
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
