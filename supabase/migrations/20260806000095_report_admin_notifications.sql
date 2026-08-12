-- Report → moderator notifications: when a user submits a report, every
-- moderator/admin gets a notification so the queue is not only visible
-- inside /admin (which nobody visits unprompted).
-- Cooldown: max one report notification per moderator per 2 minutes —
-- the exact open count lives in the admin nav badge; the notification is
-- just a nudge to look.

create or replace function public.report_notify_moderators()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mod uuid;
  v_recent uuid;
begin
  if new.status <> 'open' then
    return new;
  end if;

  for v_mod in
    select ur.user_id
    from public.user_roles ur
    where ur.role in ('moderator', 'admin')
  loop
    -- Cooldown per moderator: one nudge per 2 minutes is enough.
    select n.id into v_recent
    from public.notifications n
    where n.recipient_id = v_mod
      and n.type = 'report_open'
      and n.created_at > now() - interval '2 minutes'
    limit 1;

    if v_recent is not null then
      continue;
    end if;

    insert into public.notifications (
      recipient_id, actor_id, type, entity_type, entity_id, payload
    ) values (
      v_mod,
      new.reporter_id,
      'report_open',
      'report',
      new.id,
      jsonb_build_object(
        'target_type', new.target_type,
        'reason', new.reason,
        'details', left(coalesce(new.details, ''), 200)
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists report_notify_moderators_trg on public.reports;
create trigger report_notify_moderators_trg
after insert on public.reports
for each row
execute function public.report_notify_moderators();
