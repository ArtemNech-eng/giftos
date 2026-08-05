-- Web push subscriptions for browser notifications.
-- Push is optional: users opt in from the UI; no subscription, no delivery.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);

create index if not exists push_subscriptions_profile_idx on public.push_subscriptions (profile_id, created_at desc);

alter table public.push_subscriptions enable row level security;
create policy "users see own push subscriptions" on public.push_subscriptions
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "users create own push subscriptions" on public.push_subscriptions
  for insert with check (profile_id = auth.uid());
create policy "users delete own push subscriptions" on public.push_subscriptions
  for delete using (profile_id = auth.uid());
