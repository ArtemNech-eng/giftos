-- First creator content format: short vertical video stories.

do $$
begin
  create type public.story_access_type as enum ('free', 'paid');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_unlock_status as enum ('pending', 'unlocked', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 500),
  access_type public.story_access_type not null default 'free',
  unlock_price_minor bigint check (unlock_price_minor is null or unlock_price_minor > 0),
  currency char(3) not null default 'RUB',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  check ((access_type = 'free' and unlock_price_minor is null) or (access_type = 'paid' and unlock_price_minor is not null))
);

create index if not exists stories_active_feed_idx on public.stories (expires_at desc, created_at desc);
create index if not exists stories_author_idx on public.stories (author_id, created_at desc);

create table if not exists public.story_unlocks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  status public.story_unlock_status not null default 'pending',
  provider text,
  provider_payment_id text,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (story_id, viewer_id)
);

alter table public.stories enable row level security;
alter table public.story_unlocks enable row level security;

create policy "active stories are visible" on public.stories for select using (
  author_id = auth.uid()
  or (expires_at > now() and exists (select 1 from public.profiles p where p.id = author_id and p.profile_visibility = 'public' and not p.is_suspended))
  or public.is_admin()
);
create policy "creators create own stories" on public.stories for insert with check (author_id = auth.uid());
create policy "creators delete own stories" on public.stories for delete using (author_id = auth.uid() or public.is_admin());

create policy "viewers see own story unlocks" on public.story_unlocks for select using (viewer_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-media',
  'story-media',
  false,
  52428800,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
