-- Digital city places: fixed city spots (Center, Night, Games...) plus
-- user hangouts. Presence is soft online (activity within the last 15
-- minutes), not a websocket session, so counters stay honest.

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 500),
  emoji text not null default '🏙',
  kind text not null default 'fixed' check (kind in ('fixed', 'personal', 'temporary')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists places_city_idx on public.places (city_id, is_active, created_at asc);

create table if not exists public.place_members (
  place_id uuid not null references public.places(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('creator', 'member')),
  created_at timestamptz not null default now(),
  primary key (place_id, profile_id)
);
create index if not exists place_members_place_idx on public.place_members (place_id, created_at asc);

-- Soft presence: updated on entry and on each activity in the place.
create table if not exists public.place_presence (
  place_id uuid not null references public.places(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  entered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (place_id, profile_id)
);
create index if not exists place_presence_place_idx on public.place_presence (place_id, last_seen_at desc);

create table if not exists public.place_messages (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists place_messages_place_idx on public.place_messages (place_id, created_at asc) where not is_hidden;

alter table public.places enable row level security;
alter table public.place_members enable row level security;
alter table public.place_presence enable row level security;
alter table public.place_messages enable row level security;

create policy "places readable" on public.places for select using (is_active or public.is_admin());
create policy "users create places" on public.places for insert with check (creator_id = auth.uid());
create policy "creators update own places" on public.places for update using (creator_id = auth.uid() or public.is_admin()) with check (creator_id = auth.uid() or public.is_admin());

create policy "place members readable" on public.place_members for select using (true);
create policy "users join places" on public.place_members for insert with check (profile_id = auth.uid());
create policy "users leave places" on public.place_members for delete using (profile_id = auth.uid());

create policy "place presence readable" on public.place_presence for select using (true);
create policy "users set own presence" on public.place_presence for insert with check (profile_id = auth.uid());
create policy "users update own presence" on public.place_presence for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "place messages readable" on public.place_messages for select using (not is_hidden or public.is_admin());
create policy "users write place messages" on public.place_messages for insert with check (author_id = auth.uid());
create policy "moderators hide place messages" on public.place_messages for update using (public.is_admin()) with check (public.is_admin());

-- Soft online helper: active within the last 15 minutes.
create or replace function public.is_place_online(p_last_seen timestamptz)
returns boolean
language sql
stable
as $$
  select p_last_seen >= now() - interval '15 minutes';
$$;

alter publication supabase_realtime add table public.place_presence, public.place_messages, public.places;
