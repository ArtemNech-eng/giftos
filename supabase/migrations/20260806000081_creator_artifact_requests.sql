-- Creator Support Artifact Request (test-mode): a sender chooses a support
-- artifact for a creator; the creator accepts or rejects. Only accepted
-- requests mint the instance, spend ⭐ and credit the creator ledger 80/20
-- (creator 80% / platform 20%) in test mode. No real payout, no cash-out,
-- no bypassing consent, DM or automatic income from ordinary collectible
-- gifts.

create table if not exists public.creator_artifact_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  series_id uuid not null references public.collectible_artifact_series(id) on delete restrict,
  note text check (note is null or char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  decided_at timestamptz,
  instance_id uuid references public.collectible_artifact_instances(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists creator_artifact_requests_creator_idx
  on public.creator_artifact_requests (creator_id, status, created_at desc);
create index if not exists creator_artifact_requests_sender_idx
  on public.creator_artifact_requests (sender_id, created_at desc);

alter table public.creator_artifact_requests enable row level security;
create policy "participants read own artifact requests"
  on public.creator_artifact_requests for select using (
    creator_id = auth.uid() or sender_id = auth.uid() or public.is_admin()
  );
create policy "senders create artifact requests"
  on public.creator_artifact_requests for insert with check (
    sender_id = auth.uid()
    and creator_id <> auth.uid()
  );
create policy "creators decide own artifact requests"
  on public.creator_artifact_requests for update using (
    creator_id = auth.uid() or public.is_admin()
  ) with check (
    creator_id = auth.uid() or public.is_admin()
  );

-- Send a support artifact request. The sender is charged ⭐ only when the
-- creator accepts, not at request time.
create or replace function public.request_creator_artifact(
  p_creator_id uuid,
  p_series_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if p_creator_id = auth.uid() then raise exception 'Cannot request yourself'; end if;

  if not exists (
    select 1 from public.profiles
    where id = p_creator_id and is_creator = true and is_suspended = false
  ) then
    raise exception 'Creator is unavailable';
  end if;
  if not exists (
    select 1 from public.collectible_artifact_series
    where id = p_series_id and is_active = true
  ) then
    raise exception 'Collectible not found';
  end if;

  insert into public.creator_artifact_requests (creator_id, sender_id, series_id, note)
  values (p_creator_id, auth.uid(), p_series_id, p_note)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- Creator accepts a request: mint the instance, charge the sender, credit
-- the creator ledger (test 80/20). Idempotent per request.
create or replace function public.accept_creator_artifact_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_cost integer;
  v_total integer;
  v_remaining integer;
  v_serial integer;
  v_balance integer;
  v_instance_id uuid;
  v_creator_net integer;
  v_fee integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select * into v_request
  from public.creator_artifact_requests
  where id = p_request_id and creator_id = auth.uid()
  for update;
  if v_request.id is null then raise exception 'Request not found'; end if;
  if v_request.status <> 'pending' then raise exception 'Already decided'; end if;

  select price_stars, total_edition, remaining_edition
    into v_cost, v_total, v_remaining
  from public.collectible_artifact_series
  where id = v_request.series_id and is_active = true
  for update;
  if v_cost is null then raise exception 'Collectible not found'; end if;
  if v_remaining <= 0 then raise exception 'Edition exhausted'; end if;

  perform public.guard_daily_spend(v_cost);

  select available_balance into v_balance
  from public.bonus_wallets
  where profile_id = v_request.sender_id
  for update;
  if coalesce(v_balance, 0) < v_cost then raise exception 'Sender has insufficient balance'; end if;

  update public.collectible_artifact_series
  set remaining_edition = remaining_edition - 1,
      updated_at = now()
  where id = v_request.series_id and remaining_edition > 0
  returning total_edition - remaining_edition into v_serial;
  if v_serial is null then raise exception 'Edition exhausted'; end if;

  update public.bonus_wallets
  set available_balance = available_balance - v_cost,
      total_spent = total_spent + v_cost,
      updated_at = now()
  where profile_id = v_request.sender_id;

  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (
    v_request.sender_id,
    -v_cost,
    'spent',
    'collectible_purchase',
    jsonb_build_object('recipient_id', v_request.creator_id, 'series_id', v_request.series_id, 'serial_number', v_serial, 'support_request', v_request.id)
  );

  insert into public.collectible_artifact_instances
    (series_id, serial_number, sender_id, recipient_id)
  values
    (v_request.series_id, v_serial, v_request.sender_id, v_request.creator_id)
  returning id into v_instance_id;

  -- Test-mode creator income: 80% creator / 20% platform.
  v_creator_net := (v_cost * 80) / 100;
  v_fee := v_cost - v_creator_net;

  insert into public.creator_ledger_entries
    (creator_id, source_type, source_id, gross_minor, platform_fee_minor, creator_net_minor, currency, status)
  values
    (v_request.creator_id, 'support', v_instance_id, v_cost, v_fee, v_creator_net, 'RUB', 'test');

  update public.creator_artifact_requests
  set status = 'accepted',
      decided_at = now(),
      instance_id = v_instance_id
  where id = v_request.id;

  return true;
end;
$$;

-- Creator rejects a request: nothing is minted, nothing is charged.
create or replace function public.reject_creator_artifact_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select * into v_request
  from public.creator_artifact_requests
  where id = p_request_id and creator_id = auth.uid()
  for update;
  if v_request.id is null then raise exception 'Request not found'; end if;
  if v_request.status <> 'pending' then raise exception 'Already decided'; end if;

  update public.creator_artifact_requests
  set status = 'rejected',
      decided_at = now()
  where id = v_request.id;

  return true;
end;
$$;

grant execute on function public.request_creator_artifact(uuid, uuid, text) to authenticated;
grant execute on function public.accept_creator_artifact_request(uuid) to authenticated;
grant execute on function public.reject_creator_artifact_request(uuid) to authenticated;
