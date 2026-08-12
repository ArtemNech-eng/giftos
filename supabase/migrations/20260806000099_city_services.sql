-- City services & venues (PM: «Городская сцена — заведения и исполнители»).
-- Free listing phase: anyone with a city can post a service («делаю маникюр»)
-- or a venue («моё кафе»). No payments, no leads-for-money, no PII beyond
-- what the owner chooses to publish (contact_text is free-form: phone or
-- @telegram). Moderation: owner can hide/unhide; admins can hide any.
-- The paid «Мастера города» tier (490 ₽/мес) comes later, after a payment
-- partner is wired — this migration only lays the free liquidity layer.

create table if not exists public.service_categories (
  slug text primary key check (slug ~ '^[a-z0-9_]{2,40}$'),
  label text not null unique,
  icon_code text not null default 'store',
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

insert into public.service_categories (slug, label, icon_code, sort_order) values
  ('beauty', 'Красота', 'sparkles', 1),
  ('health', 'Здоровье', 'heartpulse', 2),
  ('repair', 'Ремонт', 'wrench', 3),
  ('education', 'Обучение', 'graduationcap', 4),
  ('events', 'Организация', 'calendardays', 5),
  ('food', 'Еда и напитки', 'coffee', 6),
  ('transport', 'Транспорт', 'car', 7),
  ('other', 'Другое', 'store', 8)
on conflict (slug) do update set
  label = excluded.label,
  icon_code = excluded.icon_code,
  sort_order = excluded.sort_order,
  is_active = true;

create table if not exists public.city_services (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'service' check (kind in ('service', 'business')),
  title text not null check (char_length(title) between 2 and 80),
  category_slug text not null references public.service_categories(slug),
  description text check (description is null or char_length(description) <= 1500),
  contact_text text check (contact_text is null or char_length(contact_text) <= 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists city_services_city_idx on public.city_services (city_id, is_active, created_at desc);
create index if not exists city_services_owner_idx on public.city_services (owner_id, is_active);

alter table public.service_categories enable row level security;
alter table public.city_services enable row level security;

create policy "service categories readable" on public.service_categories for select using (true);
create policy "service categories admin write" on public.service_categories for all using (public.is_admin()) with check (public.is_admin());

create policy "active services readable" on public.city_services for select using (is_active or owner_id = auth.uid() or public.is_admin());
create policy "users create own services" on public.city_services for insert with check (owner_id = auth.uid());
create policy "owners update own services" on public.city_services for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "owners delete own services" on public.city_services for delete using (owner_id = auth.uid() or public.is_admin());

-- Public listings with owner identity (active + not suspended only).
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
  s.created_at,
  p.username::text as owner_username,
  p.display_name as owner_display_name
from public.city_services s
join public.profiles p on p.id = s.owner_id
where s.is_active = true
  and p.is_suspended = false
order by s.created_at desc;

grant select on public.public_city_services to anon, authenticated;

