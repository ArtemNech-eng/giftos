-- Gift reasons: the sender picks an occasion when sending a gift
-- («С днём рождения», «Просто так», ...) — like Telegram gift occasions.

alter table public.collectible_artifact_instances
  add column if not exists reason text check (
    reason is null or reason in (
      'birthday', 'just_because', 'love', 'sorry', 'victory', 'congrats'
    )
  );

alter table public.creator_artifact_requests
  add column if not exists reason text check (
    reason is null or reason in (
      'birthday', 'just_because', 'love', 'sorry', 'victory', 'congrats'
    )
  );

-- Extend send_collectible_artifact with an optional reason.
create or replace function public.send_collectible_artifact(
  p_recipient_id uuid,
  p_series_id uuid,
  p_reason text default null
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
  if p_reason is not null and p_reason not in (
    'birthday', 'just_because', 'love', 'sorry', 'victory', 'congrats'
  ) then
    raise exception 'Unknown reason';
  end if;

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
    (series_id, serial_number, sender_id, recipient_id, reason)
  values
    (p_series_id, v_serial, auth.uid(), p_recipient_id, p_reason)
  returning id into v_instance_id;

  return v_instance_id;
end;
$$;

grant execute on function public.send_collectible_artifact(uuid, uuid, text) to authenticated;

-- Extend request_creator_artifact with an optional reason.
create or replace function public.request_creator_artifact(
  p_creator_id uuid,
  p_series_id uuid,
  p_note text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_series_title text;
  v_recent integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if p_creator_id = auth.uid() then raise exception 'Cannot request yourself'; end if;
  if p_reason is not null and p_reason not in (
    'birthday', 'just_because', 'love', 'sorry', 'victory', 'congrats'
  ) then
    raise exception 'Unknown reason';
  end if;

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

  select count(*) into v_recent
  from public.creator_artifact_requests
  where sender_id = auth.uid()
    and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Too many requests, wait an hour';
  end if;

  insert into public.creator_artifact_requests (creator_id, sender_id, series_id, note, reason)
  values (p_creator_id, auth.uid(), p_series_id, p_note, p_reason)
  returning id into v_request_id;

  select title into v_series_title
  from public.collectible_artifact_series
  where id = p_series_id;

  insert into public.notifications (
    recipient_id, actor_id, type, entity_type, entity_id, payload
  ) values (
    p_creator_id,
    auth.uid(),
    'creator_artifact_request',
    'creator_artifact_request',
    v_request_id,
    jsonb_build_object('series_title', v_series_title, 'reason', p_reason)
  );

  return v_request_id;
end;
$$;

grant execute on function public.request_creator_artifact(uuid, uuid, text, text) to authenticated;
