-- Engagement for short-lived stories: views and lightweight reactions.

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists public.story_reactions (
  story_id uuid not null references public.stories(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'fire', 'wow')),
  created_at timestamptz not null default now(),
  primary key (story_id, sender_id, reaction)
);

create index if not exists story_reactions_story_idx on public.story_reactions (story_id, created_at desc);

alter table public.story_views enable row level security;
alter table public.story_reactions enable row level security;

create policy "authors see story views" on public.story_views
  for select using (
    viewer_id = auth.uid()
    or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
    or public.is_admin()
  );
create policy "users create own story views" on public.story_views
  for insert with check (viewer_id = auth.uid());
create policy "story reactions visible to story users" on public.story_reactions
  for select using (
    sender_id = auth.uid()
    or exists (select 1 from public.stories s where s.id = story_id and (s.author_id = auth.uid() or s.expires_at > now()))
    or public.is_admin()
  );
create policy "users create own story reactions" on public.story_reactions
  for insert with check (sender_id = auth.uid());
create policy "users delete own story reactions" on public.story_reactions
  for delete using (sender_id = auth.uid());
