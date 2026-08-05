-- Test virtual gifts for video stories.

create table if not exists public.virtual_gifts (
  code text primary key check (code ~ '^[a-z0-9-]{2,40}$'),
  label text not null,
  emoji text not null,
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  sort_order smallint not null unique,
  is_active boolean not null default true
);

insert into public.virtual_gifts (code, label, emoji, price_minor, sort_order) values
  ('heart', 'Сердце', '❤️', 1000, 1),
  ('fire', 'Огонь', '🔥', 5000, 2),
  ('party', 'Вау', '🎉', 10000, 3),
  ('diamond', 'Алмаз', '💎', 50000, 4)
on conflict (code) do update set label = excluded.label, emoji = excluded.emoji, price_minor = excluded.price_minor, sort_order = excluded.sort_order;

create table if not exists public.story_gifts (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null references public.virtual_gifts(code) on delete restrict,
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  created_at timestamptz not null default now()
);

create index if not exists story_gifts_story_idx on public.story_gifts (story_id, created_at desc);

alter table public.virtual_gifts enable row level security;
alter table public.story_gifts enable row level security;

create policy "gifts catalog readable" on public.virtual_gifts for select using (is_active or public.is_admin());
create policy "story gifts visible for accessible stories" on public.story_gifts for select using (
  sender_id = auth.uid()
  or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
  or public.is_admin()
);
create policy "users send own story gifts" on public.story_gifts for insert with check (sender_id = auth.uid());
