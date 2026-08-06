-- Stage 2 of the economy: promote profile / live / event for stars.
-- Same pattern as wish/place promotions: cost from bonus_settings, spend
-- from wallet, ledger entry, idempotent history, visibility window.

alter table public.bonus_settings
  add column if not exists profile_promotion_cost integer not null default 300 check (profile_promotion_cost > 0),
  add column if not exists live_promotion_cost integer not null default 150 check (live_promotion_cost > 0),
  add column if not exists event_promotion_cost integer not null default 100 check (event_promotion_cost > 0);

alter table public.profiles
  add column if not exists promoted_until timestamptz;

alter table public.live_rooms
  add column if not exists promoted_until timestamptz;

alter table public.events
  add column if not exists promoted_until timestamptz;

create table if not exists public.profile_promotions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cost_bonus integer not null check (cost_bonus > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists profile_promotions_profile_idx on public.profile_promotions (profile_id, expires_at desc);

create table if not exists public.live_promotions (
  id uuid primary key default gen_random_uuid(),
  live_room_id uuid not null references public.live_rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cost_bonus integer not null check (cost_bonus > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_promotions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cost_bonus integer not null check (cost_bonus > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profile_promotions enable row level security;
alter table public.live_promotions enable row level security;
alter table public.event_promotions enable row level security;
create policy "owners see own profile promotions" on public.profile_promotions for select using (profile_id = auth.uid() or public.is_admin());
create policy "owners see own live promotions" on public.live_promotions for select using (profile_id = auth.uid() or public.is_admin());
create policy "owners see own event promotions" on public.event_promotions for select using (profile_id = auth.uid() or public.is_admin());

-- Generic promotion helper.
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
    select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
    if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
    ends_at := greatest(coalesce((select promoted_until from public.profiles where id = p_target_id), now()), now()) + interval '24 hours';
    update public.profiles set promoted_until = ends_at where id = p_target_id;
    insert into public.profile_promotions (profile_id, cost_bonus, expires_at) values (p_target_id, cost, ends_at);
  elsif p_target = 'live' then
    if not exists (select 1 from public.live_rooms where id = p_target_id and host_id = auth.uid()) then
      raise exception 'Only the host can promote the live';
    end if;
    select live_promotion_cost into cost from public.bonus_settings where id = true;
    select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
    if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
    ends_at := greatest(coalesce((select promoted_until from public.live_rooms where id = p_target_id), now()), now()) + interval '6 hours';
    update public.live_rooms set promoted_until = ends_at where id = p_target_id;
    insert into public.live_promotions (live_room_id, profile_id, cost_bonus, expires_at) values (p_target_id, auth.uid(), cost, ends_at);
  elsif p_target = 'event' then
    if not exists (select 1 from public.events where id = p_target_id and author_id = auth.uid()) then
      raise exception 'Only the author can promote the event';
    end if;
    select event_promotion_cost into cost from public.bonus_settings where id = true;
    select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
    if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;
    ends_at := greatest(coalesce((select promoted_until from public.events where id = p_target_id), now()), now()) + interval '24 hours';
    update public.events set promoted_until = ends_at where id = p_target_id;
    insert into public.event_promotions (event_id, profile_id, cost_bonus, expires_at) values (p_target_id, auth.uid(), cost, ends_at);
  else
    raise exception 'Unknown target';
  end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'promotion_spend', jsonb_build_object('target', p_target, 'target_id', p_target_id, 'expires_at', ends_at));
  return ends_at;
end;
$$;

grant execute on function public.promote_with_hocu_bonus(text, uuid) to authenticated;
