-- Live room v1: room lifecycle, chat and audience. Media transport/SFU is a
-- separate infrastructure layer and is intentionally not implemented in SQL.

do $$
begin
  create type public.live_room_status as enum ('live', 'ended');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.live_room_visibility as enum ('public', 'unlisted', 'private');
exception when duplicate_object then null;
end $$;

create table if not exists public.live_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  slug citext not null unique check (slug ~ '^[a-z0-9-]{6,100}$'),
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 1000),
  category_slug text references public.categories(slug) on delete set null,
  wish_id uuid references public.wishes(id) on delete set null,
  visibility public.live_room_visibility not null default 'public',
  status public.live_room_status not null default 'live',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists live_rooms_feed_idx on public.live_rooms (started_at desc) where status = 'live' and visibility = 'public';

create table if not exists public.live_room_participants (
  room_id uuid not null references public.live_rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('host', 'cohost', 'viewer')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, profile_id)
);

create table if not exists public.live_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.live_rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists live_room_messages_idx on public.live_room_messages (room_id, created_at asc);

alter table public.live_rooms enable row level security;
alter table public.live_room_participants enable row level security;
alter table public.live_room_messages enable row level security;

create policy "public live rooms visible" on public.live_rooms for select using (
  visibility in ('public', 'unlisted') or host_id = auth.uid() or public.is_admin()
);
create policy "creators create own live rooms" on public.live_rooms for insert with check (host_id = auth.uid());
create policy "hosts update live rooms" on public.live_rooms for update using (host_id = auth.uid() or public.is_admin()) with check (host_id = auth.uid() or public.is_admin());

create policy "participants visible in accessible rooms" on public.live_room_participants for select using (
  exists (select 1 from public.live_rooms r where r.id = room_id and (r.visibility in ('public','unlisted') or r.host_id = auth.uid()))
);
create policy "users join own live room participant" on public.live_room_participants for insert with check (profile_id = auth.uid());
create policy "users update own participation" on public.live_room_participants for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "live room chat visible" on public.live_room_messages for select using (
  exists (select 1 from public.live_rooms r where r.id = room_id and (r.visibility in ('public','unlisted') or r.host_id = auth.uid()))
);
create policy "users write live chat" on public.live_room_messages for insert with check (author_id = auth.uid());

alter publication supabase_realtime add table public.live_room_messages, public.live_rooms;
