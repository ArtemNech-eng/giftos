-- Place chat notifications: the place owner is notified when someone writes
-- in their place (hangout or personal place). Anti-spam: at most one
-- notification per place per 3 minutes, and never for your own messages.

create or replace function public.place_message_notify_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_place record;
  v_recent uuid;
begin
  select p.creator_id, p.name, p.emoji into v_place.creator_id, v_place.name, v_place.emoji
  from public.places p
  where p.id = new.place_id;

  if v_place.creator_id is null or v_place.creator_id = new.author_id then
    return new;
  end if;

  -- Cooldown: one notification per place per 3 minutes is enough; the chat
  -- itself stays realtime, the notification is just a gentle nudge.
  select n.id into v_recent
  from public.notifications n
  where n.recipient_id = v_place.creator_id
    and n.type = 'place_message'
    and n.entity_id = new.place_id
    and n.created_at > now() - interval '3 minutes'
  limit 1;

  if v_recent is not null then
    return new;
  end if;

  insert into public.notifications (
    recipient_id, actor_id, type, entity_type, entity_id, payload
  ) values (
    v_place.creator_id,
    new.author_id,
    'place_message',
    'place',
    new.place_id,
    jsonb_build_object(
      'place_id', new.place_id,
      'place_name', v_place.name,
      'place_emoji', v_place.emoji
    )
  );

  return new;
end;
$$;

drop trigger if exists place_message_notify_owner_trg on public.place_messages;
create trigger place_message_notify_owner_trg
  after insert on public.place_messages
  for each row execute function public.place_message_notify_owner();
