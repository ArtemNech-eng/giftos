-- Unread place messages: place_presence gains last_read_at; the city screen
-- shows how many messages arrived after the user's last visit.

alter table public.place_presence
  add column if not exists last_read_at timestamptz;

-- Mark the place as read up to now (called when the user enters the place).
create or replace function public.mark_place_read(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.place_presence (place_id, profile_id, entered_at, last_seen_at, last_read_at)
  values (p_place_id, auth.uid(), now(), now(), now())
  on conflict (place_id, profile_id) do update
    set last_read_at = now(), last_seen_at = now();
end;
$$;

grant execute on function public.mark_place_read(uuid) to authenticated;
