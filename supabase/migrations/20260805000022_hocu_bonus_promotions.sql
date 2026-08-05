alter table public.bonus_settings
  add column if not exists wish_promotion_cost integer not null default 500 check (wish_promotion_cost > 0);

alter table public.wishes
  add column if not exists promoted_until timestamptz;

create table if not exists public.wish_promotions (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cost_bonus integer not null check (cost_bonus > 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists wish_promotions_wish_idx on public.wish_promotions (wish_id, expires_at desc);

alter table public.wish_promotions enable row level security;
create policy "owners see own wish promotions" on public.wish_promotions for select using (profile_id = auth.uid() or public.is_admin());

create or replace function public.promote_wish_with_hocu_bonus(p_wish_id uuid)
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
  if not exists (select 1 from public.wishes where id = p_wish_id and author_id = auth.uid() and visibility = 'public' and not is_archived) then
    raise exception 'Only the owner can promote an active public wish';
  end if;
  select wish_promotion_cost into cost from public.bonus_settings where id = true;
  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
  ends_at := greatest(coalesce((select promoted_until from public.wishes where id = p_wish_id), now()), now()) + interval '24 hours';

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'promotion_spend', jsonb_build_object('wish_id', p_wish_id, 'expires_at', ends_at));
  update public.wishes set promoted_until = ends_at, updated_at = now() where id = p_wish_id;
  insert into public.wish_promotions (wish_id, profile_id, cost_bonus, expires_at) values (p_wish_id, auth.uid(), cost, ends_at);
  return ends_at;
end;
$$;
grant execute on function public.promote_wish_with_hocu_bonus(uuid) to authenticated;
