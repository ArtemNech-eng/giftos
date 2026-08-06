-- Stage 3 of the economy: hangout styling and premium creator features.
-- Place creators can buy themes and emblems for their place with stars
-- (100% platform revenue).

alter table public.bonus_settings
  add column if not exists place_theme_cost integer not null default 300 check (place_theme_cost > 0),
  add column if not exists place_emblem_cost integer not null default 200 check (place_emblem_cost > 0);

-- Place themes: color gradient presets.
create table if not exists public.place_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  gradient text not null check (char_length(gradient) <= 120),
  price_stars integer not null check (price_stars > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.place_themes (name, gradient, price_stars, sort_order) values
  ('Ночь', 'from-[#0b1e3a] via-[#14255c] to-[#0d1030]', 300, 1),
  ('Закат', 'from-[#3b183f] via-[#7d2a4d] to-[#2a1222]', 300, 2),
  ('Неон', 'from-[#1b1035] via-[#4a1a6e] to-[#0d1030]', 300, 3),
  ('Лес', 'from-[#0c2b1d] via-[#14432c] to-[#0d1030]', 300, 4)
on conflict do nothing;

-- Place emblems: small badges shown next to the place name.
create table if not exists public.place_emblems (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  emoji text not null default '🏅',
  price_stars integer not null check (price_stars > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.place_emblems (name, emoji, price_stars, sort_order) values
  ('Лапа', '🐾', 200, 1),
  ('Корона', '👑', 200, 2),
  ('Молния', '⚡', 200, 3),
  ('Сердце', '💖', 200, 4)
on conflict do nothing;

alter table public.places
  add column if not exists theme_id uuid references public.place_themes(id) on delete set null,
  add column if not exists emblem_id uuid references public.place_emblems(id) on delete set null;

alter table public.place_themes enable row level security;
alter table public.place_emblems enable row level security;
create policy "place themes readable" on public.place_themes for select using (is_active or public.is_admin());
create policy "place emblems readable" on public.place_emblems for select using (is_active or public.is_admin());

-- Buy a theme for a place (creator only, stars).
create or replace function public.buy_place_theme(p_place_id uuid, p_theme_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if not exists (select 1 from public.places where id = p_place_id and creator_id = auth.uid() and is_active = true) then
    raise exception 'Only the creator can style the place';
  end if;
  select price_stars into cost from public.place_themes where id = p_theme_id and is_active = true;
  if cost is null then raise exception 'Theme not found'; end if;
  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'place_style', jsonb_build_object('place_id', p_place_id, 'theme_id', p_theme_id));
  update public.places set theme_id = p_theme_id where id = p_place_id;
  return true;
end;
$$;

-- Buy an emblem for a place (creator only, stars).
create or replace function public.buy_place_emblem(p_place_id uuid, p_emblem_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cost integer;
  balance integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if not exists (select 1 from public.places where id = p_place_id and creator_id = auth.uid() and is_active = true) then
    raise exception 'Only the creator can style the place';
  end if;
  select price_stars into cost from public.place_emblems where id = p_emblem_id and is_active = true;
  if cost is null then raise exception 'Emblem not found'; end if;
  select available_balance into balance from public.bonus_wallets where profile_id = auth.uid() for update;
  if coalesce(balance, 0) < cost then raise exception 'Insufficient bonus balance'; end if;

  update public.bonus_wallets set available_balance = available_balance - cost, total_spent = total_spent + cost, updated_at = now() where profile_id = auth.uid();
  insert into public.bonus_ledger_entries (profile_id, amount, status, type, metadata)
  values (auth.uid(), -cost, 'spent', 'place_style', jsonb_build_object('place_id', p_place_id, 'emblem_id', p_emblem_id));
  update public.places set emblem_id = p_emblem_id where id = p_place_id;
  return true;
end;
$$;

grant execute on function public.buy_place_theme(uuid, uuid), public.buy_place_emblem(uuid, uuid) to authenticated;
