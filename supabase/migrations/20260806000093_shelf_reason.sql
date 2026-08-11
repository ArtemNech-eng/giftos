-- Expose the gift reason on the public shelf so the recipient's profile can
-- show the occasion («С днём рождения 🎂», «Люблю ❤️», ...).

drop view if exists public.public_collectible_artifact_shelf;
create or replace view public.public_collectible_artifact_shelf
with (security_invoker = false)
as
select
  instance.id,
  instance.recipient_id,
  instance.series_id,
  instance.serial_number,
  instance.issued_at,
  instance.reason,
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
