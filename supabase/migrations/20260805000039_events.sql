-- Local events: city-level activities (meetups, walks, tournaments).
-- An event is either local (only for the city) or open (whole platform).
-- Attendance is a simple join table; the author may cancel the event.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  city_id uuid references public.cities(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  description text check (description is null or char_length(description) <= 2000),
  event_type text not null default 'meetup' check (event_type in ('meetup', 'walk', 'game', 'concert', 'stream', 'other')),
  scope text not null default 'local' check (scope in ('local', 'open')),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > starts_at),
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists events_city_idx on public.events (city_id, starts_at desc) where not is_cancelled;
create index if not exists events_open_idx on public.events (starts_at desc) where scope = 'open' and not is_cancelled;

create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index if not exists event_attendees_event_idx on public.event_attendees (event_id, created_at asc);

alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

create policy "events readable" on public.events for select using (
  not is_cancelled
  or author_id = auth.uid()
  or public.is_admin()
);
create policy "users create events" on public.events for insert with check (author_id = auth.uid());
create policy "authors update own events" on public.events for update using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());

create policy "attendees readable" on public.event_attendees for select using (true);
create policy "users join events" on public.event_attendees for insert with check (profile_id = auth.uid());
create policy "users leave events" on public.event_attendees for delete using (profile_id = auth.uid());

alter publication supabase_realtime add table public.events, public.event_attendees;
