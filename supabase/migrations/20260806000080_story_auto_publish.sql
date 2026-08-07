-- Story auto-publish: switch from pre-moderation to reactive moderation.
-- New stories are published immediately (approved by default) and the
-- moderation queue is only fed by reports (hide_story sets 'rejected'),
-- which matches how modern platforms handle user video.

-- 1) New stories default to published.
alter table public.stories
  alter column moderation_status set default 'approved';

-- 2) Any leftover pending uploads (pre-moderation era) are published too.
update public.stories
set moderation_status = 'approved'
where moderation_status = 'pending';

-- 3) Public visibility: everything except explicitly rejected stories.
drop policy if exists "active stories are visible" on public.stories;
create policy "active stories are visible" on public.stories
  for select using (
    author_id = auth.uid()
    or (
      expires_at > now()
      and moderation_status <> 'rejected'
      and exists (
        select 1 from public.profiles p
        where p.id = author_id and p.profile_visibility = 'public' and not p.is_suspended
      )
    )
    or public.is_admin()
  );

-- The pre-moderation queue index is no longer the source of truth; moderation
-- now works from reports. Keep an index on status for admin lookups.
drop index if exists stories_moderation_queue_idx;
create index if not exists stories_moderation_status_idx
  on public.stories (moderation_status, created_at desc);
