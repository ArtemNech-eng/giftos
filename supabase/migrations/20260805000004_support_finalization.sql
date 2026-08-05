-- Trusted payment finalization. Browser clients never receive permission to
-- change fundraiser_supports: a verified server-side payment event calls this
-- function through the service_role only.

create or replace function public.finalize_fundraiser_support(
  p_support_id uuid,
  p_status public.support_status,
  p_provider_payload jsonb default '{}'::jsonb
)
returns table (
  support_id uuid,
  fundraiser_id uuid,
  status public.support_status,
  was_finalized boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  support_record public.fundraiser_supports%rowtype;
  fundraiser_author_id uuid;
  changed boolean := false;
begin
  select * into support_record
  from public.fundraiser_supports
  where id = p_support_id
  for update;

  if not found then
    raise exception 'Support not found';
  end if;

  -- A confirmed support is immutable from a payment point of view. Duplicate
  -- callbacks return a successful idempotent response without a second comment
  -- or notification. A later refund is allowed and recalculates the total.
  if support_record.status = 'succeeded' and p_status = 'succeeded' then
    return query select support_record.id, support_record.fundraiser_id, support_record.status, false;
    return;
  end if;

  if support_record.status in ('cancelled', 'failed', 'refunded') and p_status = 'succeeded' then
    raise exception 'Terminal support status cannot be changed back to succeeded';
  end if;

  update public.fundraiser_supports
  set status = p_status,
      provider_payload = coalesce(p_provider_payload, '{}'::jsonb),
      succeeded_at = case when p_status = 'succeeded' then coalesce(succeeded_at, now()) else succeeded_at end,
      updated_at = now()
  where id = support_record.id;

  changed := true;

  if p_status = 'succeeded' then
    select author_id into fundraiser_author_id
    from public.fundraisers
    where id = support_record.fundraiser_id;

    -- A support message becomes part of the discussion exactly once. The unique
    -- support_id on fundraiser_comments protects this if an external provider
    -- retries a webhook.
    if nullif(trim(coalesce(support_record.message, '')), '') is not null then
      insert into public.fundraiser_comments (
        fundraiser_id,
        author_id,
        support_id,
        body
      ) values (
        support_record.fundraiser_id,
        support_record.supporter_id,
        support_record.id,
        support_record.message
      ) on conflict (support_id) do nothing;
    end if;

    if fundraiser_author_id is not null and fundraiser_author_id <> support_record.supporter_id then
      insert into public.notifications (
        recipient_id,
        actor_id,
        type,
        entity_type,
        entity_id,
        payload
      ) values (
        fundraiser_author_id,
        support_record.supporter_id,
        'fundraiser_support_succeeded',
        'fundraiser',
        support_record.fundraiser_id,
        jsonb_build_object(
          'support_id', support_record.id,
          'amount_minor', support_record.amount_minor,
          'currency', support_record.currency,
          'visibility', support_record.visibility
        )
      );
    end if;
  end if;

  return query select support_record.id, support_record.fundraiser_id, p_status, changed;
end;
$$;

revoke all on function public.finalize_fundraiser_support(uuid, public.support_status, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_fundraiser_support(uuid, public.support_status, jsonb) to service_role;
