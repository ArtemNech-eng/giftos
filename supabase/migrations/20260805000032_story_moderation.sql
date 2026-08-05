-- Story moderation and transcode pipeline.
-- Uploads start as 'pending'; only approved stories are publicly visible.
-- Transcoding is a separate infrastructure layer (FFmpeg worker); the column
-- tracks the pipeline state, and a test API stub marks videos as done.

do $$
begin
  create type public.story_moderation_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_transcode_status as enum ('none', 'queued', 'processing', 'done', 'failed');
exception when duplicate_object then null;
end $$;

alter table public.stories
  add column if not exists moderation_status public.story_moderation_status not null default 'pending',
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  add column if not exists moderated_at timestamptz,
  add column if not exists transcode_status public.story_transcode_status not null default 'none';

create index if not exists stories_moderation_queue_idx
  on public.stories (moderation_status, created_at asc)
  where moderation_status = 'pending';

-- Public visibility: only approved, non-expired stories from visible authors.
drop policy if exists "active stories are visible" on public.stories;
create policy "active stories are visible" on public.stories
  for select using (
    author_id = auth.uid()
    or (
      expires_at > now()
      and moderation_status = 'approved'
      and exists (
        select 1 from public.profiles p
        where p.id = author_id and p.profile_visibility = 'public' and not p.is_suspended
      )
    )
    or public.is_admin()
  );

-- Moderators may update stories (approve/reject), authors may delete their own.
create policy "moderators moderate stories" on public.stories
  for update using (public.is_admin()) with check (public.is_admin());

-- Allow moderation audit entries with target_type 'story'.
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_target_type' and e.enumlabel = 'story'
  ) then
    alter type public.report_target_type add value 'story';
  end if;
end $$;
