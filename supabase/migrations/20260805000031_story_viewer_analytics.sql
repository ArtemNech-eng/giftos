-- Story viewer analytics: authors may see who watched their story and who
-- unlocked the paid version, so the analytics screen can list real people.

drop policy if exists "viewers see own story unlocks" on public.story_unlocks;
create policy "story authors see unlocks of own stories" on public.story_unlocks
  for select using (
    viewer_id = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = story_id and s.author_id = auth.uid()
    )
    or public.is_admin()
  );
