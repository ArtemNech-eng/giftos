-- Creator artifact request polish:
-- 1) notify the creator when a support-artifact request arrives,
-- 2) anti-spam: max 5 requests per sender per hour.

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
  v_series_title text;
  v_recent integer;
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

  -- Anti-spam: at most 5 pending-or-total requests per sender per hour.
  select count(*) into v_recent
  from public.creator_artifact_requests
  where sender_id = auth.uid()
    and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Too many requests, wait an hour';
  end if;

  insert into public.creator_artifact_requests (creator_id, sender_id, series_id, note)
  values (p_creator_id, auth.uid(), p_series_id, p_note)
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
    jsonb_build_object('series_title', v_series_title)
  );

  return v_request_id;
end;
$$;

grant execute on function public.request_creator_artifact(uuid, uuid, text) to authenticated;
