-- Wish discussion: comments make a wish a social object around which
-- people communicate, support each other and find new friends.

create table if not exists public.wish_comments (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  is_hidden boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wish_comments_feed_idx on public.wish_comments (wish_id, created_at asc) where not is_hidden and deleted_at is null;

alter table public.wish_comments enable row level security;

create policy "wish comments visible for public wishes" on public.wish_comments
  for select using (
    author_id = auth.uid()
    or exists (
      select 1 from public.wishes w
      where w.id = wish_id
        and w.visibility = 'public'
        and not w.is_archived
    )
    or public.is_admin()
  );
create policy "users comment on public wishes" on public.wish_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.wishes w
      where w.id = wish_id
        and w.visibility = 'public'
        and not w.is_archived
    )
  );
create policy "moderators hide wish comments" on public.wish_comments
  for update using (public.is_admin()) with check (public.is_admin());

drop trigger if exists wish_comments_updated_at on public.wish_comments;
create trigger wish_comments_updated_at before update on public.wish_comments
  for each row execute procedure public.set_updated_at();

alter publication supabase_realtime add table public.wish_comments;
