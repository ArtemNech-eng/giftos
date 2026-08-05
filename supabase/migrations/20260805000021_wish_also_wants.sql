-- Social «Хочу также» mechanics for wishes.

alter table public.wishes
  add column if not exists also_wants_count integer not null default 0 check (also_wants_count >= 0);

create table if not exists public.wish_also_wants (
  wish_id uuid not null references public.wishes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wish_id, profile_id)
);

create index if not exists wish_also_wants_wish_idx on public.wish_also_wants (wish_id, created_at desc);

create or replace function public.refresh_wish_also_wants_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish_id uuid;
begin
  target_wish_id := case when tg_op = 'DELETE' then old.wish_id else new.wish_id end;
  update public.wishes
  set also_wants_count = (select count(*) from public.wish_also_wants where wish_id = target_wish_id),
      updated_at = now()
  where id = target_wish_id;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists wish_also_wants_refresh_count on public.wish_also_wants;
create trigger wish_also_wants_refresh_count
  after insert or delete on public.wish_also_wants
  for each row execute procedure public.refresh_wish_also_wants_count();

alter table public.wish_also_wants enable row level security;
create policy "public wish interest is readable" on public.wish_also_wants
  for select using (true);
create policy "users add own wish interest" on public.wish_also_wants
  for insert with check (profile_id = auth.uid());
create policy "users remove own wish interest" on public.wish_also_wants
  for delete using (profile_id = auth.uid());
