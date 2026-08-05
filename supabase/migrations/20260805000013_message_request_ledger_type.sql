alter table public.creator_ledger_entries
  drop constraint if exists creator_ledger_entries_source_type_check;

alter table public.creator_ledger_entries
  add constraint creator_ledger_entries_source_type_check
  check (source_type in ('story_unlock', 'support', 'subscription', 'gift', 'message_request'));
