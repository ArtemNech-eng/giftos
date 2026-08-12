-- City services premium layer (PM: «городская соцсеть — каждый может
-- проявиться»). Account-linked: every listing is owned by a profile, shows
-- the owner's avatar, and the owner gets a personal dashboard with views.
-- Features: photo gallery (up to 3), pin (one pinned listing per owner),
-- bump («поднять в выдаче»), view counter.

alter table public.city_services
  add column if not exists views_count integer not null default 0 check (views_count >= 0),
  add column if not exists pinned_at timestamptz;

-- Photo gallery: up to 3 photos per listing.
create table if not exists public.city_service_media (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.city_services(id) on delete cascade,
  storage_path text not null unique,
  sort_order smallint not null default 0 check (sort_order between 0 and 2),
  created_at timestamptz not null default now()
);
create index if not exists city_service_media_service_idx
  on public.city_service_media (service_id, sort_order asc);

alter table public.city_service_media enable row level security;

create policy "service media readable with listing" on public.city_service_media
  for select using (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and (s.is_active or s.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "owners add media" on public.city_service_media
  for insert with check (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  );
create policy "owners delete media" on public.city_service_media
  for delete using (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  );

-- Storage bucket for listing photos (private, signed URLs only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-media', 'service-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  create policy "service-media owner upload" on storage.objects
    for insert with check (bucket_id = 'service-media' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

-- Count a view: fire-and-forget, called from the listing page (the owner's
-- own views are skipped in the app).
create or replace function public.record_service_view(p_service_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.city_services
  set views_count = views_count + 1
  where id = p_service_id;
$$;

grant execute on function public.record_service_view(uuid) to authenticated;

-- Rebuild the public view with owner avatar + photo cover.
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
  ) as cover_path
from public.city_services s
join public.profiles p on p.id = s.owner_id
where s.is_active = true
  and p.is_suspended = false
order by s.pinned_at desc nulls last, s.updated_at desc, s.created_at desc;

grant select on public.public_city_services to anon, authenticated;
