-- Portfolio stories (PM: «портфолио» — мастер показывает работу в story и
-- ведёт на свою витрину). A story can carry exactly one linked service
-- listing; the link is only valid if the story author owns that listing,
-- so a story can never promote someone else's business.

alter table public.stories
  add column if not exists linked_service_id uuid references public.city_services(id) on delete set null;

create index if not exists stories_linked_service_idx
  on public.stories (linked_service_id) where linked_service_id is not null;

-- Block linking a listing the author does not own (both in insert and update).
create or replace function public.guard_story_service_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.linked_service_id is not null then
    if not exists (
      select 1 from public.city_services s
      where s.id = new.linked_service_id and s.owner_id = new.author_id
    ) then
      raise exception 'Story can only link to a listing owned by the author';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_story_service_link_trg on public.stories;
create trigger guard_story_service_link_trg
before insert or update on public.stories
for each row
execute function public.guard_story_service_link();
