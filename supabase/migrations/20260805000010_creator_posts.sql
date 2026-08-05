-- Evergreen creator posts. Unlike 24-hour stories, public posts can be indexed.

do $$
begin
  create type public.post_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end $$;

create table if not exists public.creator_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  slug citext not null unique check (slug ~ '^[a-z0-9-]{6,100}$'),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 10000),
  visibility public.post_visibility not null default 'public',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_posts_public_idx
  on public.creator_posts (published_at desc)
  where visibility = 'public';
create index if not exists creator_posts_author_idx on public.creator_posts (author_id, published_at desc);

alter table public.creator_posts enable row level security;

create policy "public posts visible by profile" on public.creator_posts
  for select using (
    author_id = auth.uid()
    or (
      visibility = 'public'
      and exists (select 1 from public.profiles p where p.id = author_id and p.profile_visibility = 'public' and not p.is_suspended)
    )
    or public.is_admin()
  );
create policy "creators add own posts" on public.creator_posts
  for insert with check (author_id = auth.uid());
create policy "creators update own posts" on public.creator_posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "creators delete own posts" on public.creator_posts
  for delete using (author_id = auth.uid() or public.is_admin());

drop trigger if exists creator_posts_updated_at on public.creator_posts;
create trigger creator_posts_updated_at before update on public.creator_posts for each row execute procedure public.set_updated_at();
