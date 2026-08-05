-- Public discussion feed with support-privacy redaction.
-- Raw comments retain author_id for moderation and the comment author, but public
-- clients read this view so an anonymous support never exposes its supporter.

drop policy if exists "comments accessible with fundraiser" on public.fundraiser_comments;
create policy "comment authors and moderators see raw comments" on public.fundraiser_comments
  for select
  using (
    author_id = auth.uid()
    or public.is_fundraiser_author(fundraiser_id)
    or public.is_admin()
  );

create or replace view public.fundraiser_comment_feed
with (security_invoker = false)
as
select
  c.id,
  c.fundraiser_id,
  case
    when c.support_id is not null and s.visibility = 'anonymous' then null
    else c.author_id
  end as display_author_id,
  c.body,
  c.support_id,
  case when c.support_id is not null then s.visibility else null end as support_visibility,
  c.created_at
from public.fundraiser_comments c
left join public.fundraiser_supports s on s.id = c.support_id
where c.is_hidden = false
  and c.deleted_at is null
  and public.can_access_fundraiser(c.fundraiser_id);

grant select on public.fundraiser_comment_feed to anon, authenticated;
