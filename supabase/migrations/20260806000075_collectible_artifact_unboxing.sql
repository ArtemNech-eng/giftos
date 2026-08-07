-- Collection v1.1: recipient-only unboxing state for a known artifact.
-- The serial is allocated during purchase; unboxing reveals it and never rolls
-- a random item or changes edition supply.

alter table public.collectible_artifact_instances
  add column if not exists unboxed_at timestamptz;

create or replace function public.unbox_collectible_artifact(p_instance_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  was_unboxed boolean;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;

  select unboxed_at is not null into was_unboxed
  from public.collectible_artifact_instances
  where id = p_instance_id and recipient_id = auth.uid()
  for update;
  if was_unboxed is null then raise exception 'Artifact is unavailable'; end if;
  if was_unboxed then return false; end if;

  update public.collectible_artifact_instances
  set unboxed_at = now()
  where id = p_instance_id and recipient_id = auth.uid();
  return true;
end;
$$;

grant execute on function public.unbox_collectible_artifact(uuid) to authenticated;

-- A recipient controls the first reveal. The public shelf starts only after
-- unboxing so a gifted serial is not shown before the presentation moment.
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
  and instance.unboxed_at is not null
  and recipient.profile_visibility = 'public'
  and recipient.is_suspended = false;

grant select on public.public_collectible_artifact_shelf to anon, authenticated;
