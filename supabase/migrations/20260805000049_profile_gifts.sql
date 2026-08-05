-- Gifts in Telegram style: buy a gift for ⭐ and send it to a person;
-- the gift is displayed on the recipient's profile. Platform economy:
-- spent stars stay with the platform (no cash-out, no exchange).

create table if not exists public.profile_gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null references public.virtual_gifts(code) on delete restrict,
  price_stars integer not null check (price_stars > 0),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists profile_gifts_recipient_idx on public.profile_gifts (recipient_id, created_at desc);

alter table public.profile_gifts enable row level security;
create policy "profile gifts visible to involved" on public.profile_gifts
  for select using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());

-- Buy and send a gift for stars (Telegram-style).
create or replace function public.send_profile_gift(p_recipient_id uuid, p_gift_code text)
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
  if p_recipient_id = auth.uid() then raise exception 'Cannot gift yourself'; end if;
  select price_stars into cost from public.virtual_gifts
  where code = p_gift_code and is_active = true and price_stars is not null;
  if cost is null then raise exception 'Gift not found'; end if;

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

grant execute on function public.send_profile_gift(uuid, text) to authenticated;
