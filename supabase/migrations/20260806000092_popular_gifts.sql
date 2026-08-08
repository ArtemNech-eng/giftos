-- Popular gifts: track how many times each gift was sent (social proof).
-- times_sent increments on every send (collectible gift) and on every
-- accepted creator-support request.

alter table public.collectible_artifact_series
  add column if not exists times_sent integer not null default 0 check (times_sent >= 0);

-- Bump times_sent on a direct gift.
create or replace function public.collectible_send_bump_times_sent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collectible_artifact_series
  set times_sent = times_sent + 1, updated_at = now()
  where id = new.series_id;
  return new;
end;
$$;

drop trigger if exists collectible_send_bump_times_sent_trg on public.collectible_artifact_instances;
create trigger collectible_send_bump_times_sent_trg
  after insert on public.collectible_artifact_instances
  for each row execute function public.collectible_send_bump_times_sent();

-- Bump times_sent on an accepted creator-support request (the instance is
-- minted at that moment, so the same trigger covers it — but the request
-- path already inserts into collectible_artifact_instances too).
