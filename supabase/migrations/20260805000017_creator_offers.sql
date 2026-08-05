-- Configurable creator action cards. Booking/payment for an offer is a later
-- vertical slice; this migration establishes the public catalog.

create table if not exists public.creator_offers (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('message', 'voice_call', 'video_call', 'game', 'activity', 'co_stream', 'custom')),
  title text not null check (char_length(title) between 1 and 80),
  description text check (description is null or char_length(description) <= 300),
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_offers_creator_idx on public.creator_offers (creator_id, sort_order, created_at desc);
alter table public.creator_offers enable row level security;

create policy "public creator offers visible" on public.creator_offers for select using (
  creator_id = auth.uid()
  or (is_active and exists (select 1 from public.profiles p where p.id = creator_id and p.profile_visibility = 'public' and not p.is_suspended))
  or public.is_admin()
);
create policy "creators manage own offers" on public.creator_offers for insert with check (creator_id = auth.uid());
create policy "creators update own offers" on public.creator_offers for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "creators delete own offers" on public.creator_offers for delete using (creator_id = auth.uid() or public.is_admin());

drop trigger if exists creator_offers_updated_at on public.creator_offers;
create trigger creator_offers_updated_at before update on public.creator_offers for each row execute procedure public.set_updated_at();
