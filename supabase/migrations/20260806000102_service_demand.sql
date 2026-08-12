-- Service demand (PM: «Хочу такого мастера»). A city resident can signal
-- demand for a concrete listing or for a whole category when the category
-- is empty — the owner sees «N people want this» and the platform gets
-- real demand data before spending anything on supply.
--
-- Rules: one demand per person per target; toggle is idempotent; the owner
-- cannot demand their own listing; demand is public as a counter (names are
-- never shown, so it is not PII exposure beyond an aggregate).

create table if not exists public.service_demands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.city_services(id) on delete cascade,
  category_slug text references public.service_categories(slug) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((service_id is null) <> (category_slug is null))
);

create unique index if not exists service_demands_service_uniq
  on public.service_demands (user_id, service_id) where service_id is not null;

create unique index if not exists service_demands_category_uniq
  on public.service_demands (user_id, category_slug) where category_slug is not null;

create index if not exists service_demands_service_idx
  on public.service_demands (service_id);
create index if not exists service_demands_category_idx
  on public.service_demands (category_slug, city_id);

alter table public.service_demands enable row level security;

create policy "demand counts readable" on public.service_demands
  for select using (true);

create policy "users create own demands" on public.service_demands
  for insert with check (user_id = auth.uid());

create policy "users delete own demands" on public.service_demands
  for delete using (user_id = auth.uid());

-- Toggle demand for a concrete listing. Returns the new state.
create or replace function public.toggle_service_demand(p_service_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city_id uuid;
  v_owner uuid;
  v_exists uuid;
begin
  if auth.uid() is null then return false; end if;

  select s.city_id, s.owner_id into v_city_id, v_owner
  from public.city_services s
  where s.id = p_service_id and s.is_active = true;

  if v_city_id is null then return false; end if;
  if v_owner = auth.uid() then return false; end if;

  select id into v_exists
  from public.service_demands
  where user_id = auth.uid() and service_id = p_service_id
  limit 1;

  if v_exists is not null then
    delete from public.service_demands where id = v_exists;
    return false;
  end if;

  insert into public.service_demands (user_id, service_id, city_id)
  values (auth.uid(), p_service_id, v_city_id);

  return true;
end;
$$;

-- Toggle demand for a whole category (used when the category is empty).
create or replace function public.toggle_category_demand(p_category_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city_id uuid;
  v_exists uuid;
begin
  if auth.uid() is null then return false; end if;

  select city_id into v_city_id
  from public.profiles
  where id = auth.uid();

  if v_city_id is null then return false; end if;

  select id into v_exists
  from public.service_demands
  where user_id = auth.uid() and category_slug = p_category_slug
  limit 1;

  if v_exists is not null then
    delete from public.service_demands where id = v_exists;
    return false;
  end if;

  insert into public.service_demands (user_id, category_slug, city_id)
  values (auth.uid(), p_category_slug, v_city_id);

  return true;
end;
$$;

-- Counts for a batch of listing ids: used by the catalog.
create or replace function public.service_demand_counts(p_ids uuid[])
returns table (service_id uuid, cnt bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d.service_id, count(*)::bigint as cnt
  from public.service_demands d
  where d.service_id = any(p_ids)
  group by d.service_id;
$$;

-- Counts for every category in a city: used by the catalog.
create or replace function public.category_demand_counts(p_city_id uuid)
returns table (category_slug text, cnt bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d.category_slug, count(*)::bigint as cnt
  from public.service_demands d
  where d.category_slug is not null and d.city_id = p_city_id
  group by d.category_slug;
$$;

grant execute on function public.toggle_service_demand(uuid) to authenticated;
grant execute on function public.toggle_category_demand(text) to authenticated;
grant execute on function public.service_demand_counts(uuid[]) to authenticated;
grant execute on function public.category_demand_counts(uuid) to authenticated;
