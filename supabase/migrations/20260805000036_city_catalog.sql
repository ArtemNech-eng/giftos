-- City catalog: foundation for the «city as entry point» concept.
-- The platform stays global; the catalog only normalizes city names so
-- city feeds, «people nearby» and city battles can rely on stable ids.

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  normalized_name text not null unique check (char_length(normalized_name) between 1 and 100),
  region text check (region is null or char_length(region) <= 100),
  country text not null default 'RU' check (char_length(country) = 2),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cities_active_idx on public.cities (is_active, sort_order, name);

-- Seed: launch city + regional neighbours + major cities.
insert into public.cities (name, normalized_name, region, country, sort_order) values
  ('Будённовск', 'буденновск', 'Ставропольский край', 'RU', 1),
  ('Ставрополь', 'ставрополь', 'Ставропольский край', 'RU', 2),
  ('Пятигорск', 'пятигорск', 'Ставропольский край', 'RU', 3),
  ('Кисловодск', 'кисловодск', 'Ставропольский край', 'RU', 4),
  ('Минеральные Воды', 'минеральные воды', 'Ставропольский край', 'RU', 5),
  ('Невинномысск', 'невинномысск', 'Ставропольский край', 'RU', 6),
  ('Москва', 'москва', 'Москва', 'RU', 10),
  ('Санкт-Петербург', 'санкт-петербург', 'Санкт-Петербург', 'RU', 11),
  ('Краснодар', 'краснодар', 'Краснодарский край', 'RU', 12),
  ('Ростов-на-Дону', 'ростов-на-дону', 'Ростовская область', 'RU', 13),
  ('Казань', 'казань', 'Татарстан', 'RU', 14),
  ('Екатеринбург', 'екатеринбург', 'Свердловская область', 'RU', 15),
  ('Новосибирск', 'новосибирск', 'Новосибирская область', 'RU', 16)
on conflict (normalized_name) do update set
  name = excluded.name,
  region = excluded.region,
  sort_order = excluded.sort_order;

alter table public.profiles
  add column if not exists city_id uuid references public.cities(id) on delete set null;

alter table public.cities enable row level security;
create policy "cities catalog readable" on public.cities for select using (is_active or public.is_admin());

-- Normalize free-text city input to a catalog entry when possible.
create or replace function public.resolve_city(p_city text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized text;
  v_id uuid;
begin
  if p_city is null or trim(p_city) = '' then
    return null;
  end if;
  v_normalized := lower(regexp_replace(trim(p_city), '[^a-zа-яё0-9 ]+', '', 'g'));
  select id into v_id from public.cities where normalized_name = v_normalized limit 1;
  if v_id is not null then
    return v_id;
  end if;
  -- Unknown city: register it so future residents normalize to the same id.
  insert into public.cities (name, normalized_name, country, sort_order)
  values (trim(p_city), v_normalized, 'RU', 100)
  on conflict (normalized_name) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.cities where normalized_name = v_normalized limit 1;
  end if;
  return v_id;
end;
$$;

grant execute on function public.resolve_city(text) to anon, authenticated;
