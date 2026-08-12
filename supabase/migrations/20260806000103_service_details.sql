-- Service/venue detail layer (PM: WhatsApp Business as reference).
--   * venues (kind='business'): address + weekly opening hours;
--   * everyone: price catalog (services & prices, like WB catalog items).
-- Pure presentation/listing data — no booking, no CRM.

alter table public.city_services
  add column if not exists address text check (address is null or char_length(address) <= 200),
  add column if not exists hours jsonb;

create table if not exists public.service_catalog_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.city_services(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  price text not null check (char_length(price) <= 40),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists service_catalog_items_service_idx
  on public.service_catalog_items (service_id, sort_order asc);

alter table public.service_catalog_items enable row level security;

create policy "catalog readable with listing" on public.service_catalog_items
  for select using (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and (s.is_active or s.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "owners add catalog items" on public.service_catalog_items
  for insert with check (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  );
create policy "owners update catalog items" on public.service_catalog_items
  for update using (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  );
create policy "owners delete catalog items" on public.service_catalog_items
  for delete using (
    exists (
      select 1 from public.city_services s
      where s.id = service_id and s.owner_id = auth.uid()
    )
  );

-- Expose the new detail fields through the public view.
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
  s.address,
  s.hours,
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
