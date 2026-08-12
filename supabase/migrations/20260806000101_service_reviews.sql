-- Service reviews (PM: «чтобы меня нашли» — репутация исполнителя).
-- One review per person per listing; the owner can reply once. Reviews are
-- visible with the listing, admin can hide; the listing view carries the
-- average rating and count so the catalog can show reputation at a glance.

create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.city_services(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 1000),
  is_hidden boolean not null default false,
  reply text check (reply is null or char_length(reply) <= 1000),
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (service_id, author_id)
);

create index if not exists service_reviews_service_idx
  on public.service_reviews (service_id, created_at desc) where not is_hidden;

alter table public.service_reviews enable row level security;

create policy "reviews readable with listing" on public.service_reviews
  for select using (
    (is_hidden = false and exists (
      select 1 from public.city_services s
      where s.id = service_id and s.is_active
    ))
    or exists (
      select 1 from public.city_services s
      where s.id = service_id and (s.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "city residents add reviews" on public.service_reviews
  for insert with check (
    author_id = auth.uid()
    and not exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  );

create policy "authors update own reviews" on public.service_reviews
  for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "authors delete own reviews" on public.service_reviews
  for delete using (author_id = auth.uid() or public.is_admin());

-- Owner reply: only the listing owner (or admin) may set reply/replied_at.
create or replace function public.reply_to_service_review(p_review_id uuid, p_reply text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_owner uuid;
begin
  if auth.uid() is null or p_reply is null or length(trim(p_reply)) = 0 then
    return false;
  end if;

  select s.owner_id into v_service_owner
  from public.service_reviews r
  join public.city_services s on s.id = r.service_id
  where r.id = p_review_id;

  if v_service_owner is null then
    return false;
  end if;

  if auth.uid() <> v_service_owner and not public.is_admin() then
    return false;
  end if;

  update public.service_reviews
  set reply = left(trim(p_reply), 1000), replied_at = now()
  where id = p_review_id;

  return true;
end;
$$;

grant execute on function public.reply_to_service_review(uuid, text) to authenticated;

-- Rebuild the public view with reputation (avg rating + review count).
create or replace view public.public_city_services
with (security_invoker = false)
as
select
  s.id,
  s.city_id,
  s.owner_id,
  s.kind,
  s.title,
  s.category_slug,
  s.description,
  s.contact_text,
  s.views_count,
  s.pinned_at,
  s.updated_at,
  s.created_at,
  p.username::text as owner_username,
  p.display_name as owner_display_name,
  p.avatar_path as owner_avatar_path,
  (
    select m.storage_path from public.city_service_media m
    where m.service_id = s.id
    order by m.sort_order asc
    limit 1
  ) as cover_path,
  (
    select round(avg(r.rating)::numeric, 1)
    from public.service_reviews r
    where r.service_id = s.id and r.is_hidden = false
  ) as rating_avg,
  (
    select count(*) from public.service_reviews r
    where r.service_id = s.id and r.is_hidden = false
  ) as rating_count
from public.city_services s
join public.profiles p on p.id = s.owner_id
where s.is_active = true
  and p.is_suspended = false
order by s.pinned_at desc nulls last, s.updated_at desc, s.created_at desc;

grant select on public.public_city_services to anon, authenticated;
