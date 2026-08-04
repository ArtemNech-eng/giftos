-- GiftOS foundation schema
-- All money is stored in minor currency units (kopecks for RUB). Payment state is
-- written only by trusted server-side code after a payment partner callback.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$
begin
  create type public.app_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_visibility as enum ('public', 'registered', 'private');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.wish_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.fundraiser_visibility as enum ('public', 'unlisted', 'private');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.fundraiser_status as enum ('draft', 'active', 'goal_reached', 'closed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.support_status as enum ('created', 'pending', 'succeeded', 'cancelled', 'refunded', 'failed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.support_visibility as enum ('exact', 'activity_only', 'anonymous');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.member_role as enum ('invited', 'viewer', 'editor');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_target_type as enum ('profile', 'wish', 'fundraiser', 'comment', 'message');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_reason as enum ('fraud', 'prohibited_content', 'false_information', 'spam', 'inappropriate_content', 'other');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('open', 'in_review', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.referral_status as enum ('registered', 'qualified', 'held', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.conversation_type as enum ('direct');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text check (char_length(bio) <= 500),
  avatar_path text,
  city text check (char_length(city) <= 100),
  show_city boolean not null default false,
  profile_visibility public.profile_visibility not null default 'public',
  allow_direct_messages boolean not null default true,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.app_role not null default 'user',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  label text not null unique,
  emoji text not null,
  sort_order smallint not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (slug, label, emoji, sort_order) values
  ('electronics', 'Электроника', '💻', 1),
  ('travel', 'Путешествия', '✈️', 2),
  ('sport', 'Спорт', '⚽', 3),
  ('music', 'Музыка', '🎸', 4),
  ('games', 'Игры', '🎮', 5),
  ('hobbies', 'Хобби', '🎨', 6),
  ('education', 'Образование', '📚', 7),
  ('clothes', 'Одежда', '🧥', 8),
  ('beauty', 'Красота', '✨', 9),
  ('cars', 'Автомобили', '🚗', 10),
  ('home', 'Дом', '🏠', 11),
  ('experiences', 'Впечатления', '🎟️', 12),
  ('holidays', 'Праздники', '🎉', 13),
  ('other', 'Другое', '💫', 14)
on conflict (slug) do update set
  label = excluded.label,
  emoji = excluded.emoji,
  sort_order = excluded.sort_order;

create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_slug text not null references public.categories(slug) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profile_id, category_slug)
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  source_wish_id uuid references public.wishes(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 3000),
  image_path text,
  product_url text check (product_url is null or product_url ~ '^https?://'),
  estimated_cost_minor bigint check (estimated_cost_minor is null or estimated_cost_minor >= 0),
  currency char(3) not null default 'RUB',
  category_slug text references public.categories(slug) on delete set null,
  visibility public.wish_visibility not null default 'public',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wishes_author_created_idx on public.wishes (author_id, created_at desc);
create index if not exists wishes_category_created_idx on public.wishes (category_slug, created_at desc) where not is_archived;

create table if not exists public.fundraisers (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  wish_id uuid references public.wishes(id) on delete set null,
  slug citext not null unique check (slug ~ '^[a-z0-9-]{6,80}$'),
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 5000),
  cover_image_path text,
  category_slug text references public.categories(slug) on delete set null,
  target_amount_minor bigint not null check (target_amount_minor > 0),
  current_amount_minor bigint not null default 0 check (current_amount_minor >= 0),
  participant_count integer not null default 0 check (participant_count >= 0),
  currency char(3) not null default 'RUB',
  visibility public.fundraiser_visibility not null default 'public',
  status public.fundraiser_status not null default 'draft',
  ends_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > created_at)
);

create index if not exists fundraisers_public_feed_idx
  on public.fundraisers (published_at desc)
  where visibility = 'public' and status in ('active', 'goal_reached');
create index if not exists fundraisers_author_created_idx on public.fundraisers (author_id, created_at desc);
create index if not exists fundraisers_category_idx on public.fundraisers (category_slug) where visibility = 'public';

create table if not exists public.fundraiser_members (
  fundraiser_id uuid not null references public.fundraisers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (fundraiser_id, profile_id)
);

create index if not exists fundraiser_members_profile_idx on public.fundraiser_members (profile_id, created_at desc);

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists user_follows_following_idx on public.user_follows (following_id, created_at desc);

create table if not exists public.fundraiser_follows (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  fundraiser_id uuid not null references public.fundraisers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, fundraiser_id)
);

create index if not exists fundraiser_follows_fundraiser_idx on public.fundraiser_follows (fundraiser_id, created_at desc);

-- A support is the internal record of a payment attempt. Browser clients cannot
-- insert or update it: only the payment webhook/service role can change status.
create table if not exists public.fundraiser_supports (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers(id) on delete restrict,
  supporter_id uuid references public.profiles(id) on delete set null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'RUB',
  visibility public.support_visibility not null default 'exact',
  message text check (char_length(message) <= 1000),
  status public.support_status not null default 'created',
  provider text,
  provider_payment_id text,
  provider_payload jsonb not null default '{}'::jsonb,
  succeeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create index if not exists fundraiser_supports_fundraiser_status_idx
  on public.fundraiser_supports (fundraiser_id, status, succeeded_at desc);
create index if not exists fundraiser_supports_supporter_idx
  on public.fundraiser_supports (supporter_id, created_at desc) where supporter_id is not null;

create table if not exists public.fundraiser_comments (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  support_id uuid unique references public.fundraiser_supports(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  is_hidden boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fundraiser_comments_feed_idx on public.fundraiser_comments (fundraiser_id, created_at asc) where not is_hidden and deleted_at is null;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null default 'direct',
  direct_key text not null unique check (direct_key ~ '^[0-9a-f-]{36}:[0-9a-f-]{36}$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index if not exists conversation_members_profile_idx on public.conversation_members (profile_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at asc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (char_length(type) between 1 and 60),
  entity_type text check (char_length(entity_type) <= 60),
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc) where read_at is null;

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 2000),
  status public.report_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_note text check (char_length(resolution_note) <= 2000),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_moderation_queue_idx on public.reports (status, created_at asc);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(id) on delete restrict,
  target_type public.report_target_type not null,
  target_id uuid not null,
  action text not null check (char_length(action) between 1 and 100),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.referral_codes (
  code citext primary key check (code ~ '^[a-z0-9]{6,20}$'),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete restrict,
  referee_id uuid not null unique references public.profiles(id) on delete restrict,
  referral_code citext not null references public.referral_codes(code) on delete restrict,
  status public.referral_status not null default 'registered',
  qualified_at timestamptz,
  hold_until timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  check (referrer_id <> referee_id)
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id, created_at desc);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 80),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helper functions are security definer so policies can use them without exposing
-- implementation tables. The explicit search_path prevents search-path hijacking.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_fundraiser_author(p_fundraiser_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fundraisers
    where id = p_fundraiser_id and author_id = auth.uid()
  );
$$;

create or replace function public.can_access_fundraiser(p_fundraiser_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.fundraisers f
    where f.id = p_fundraiser_id
      and (
        f.visibility in ('public', 'unlisted')
        or f.author_id = auth.uid()
        or exists (
          select 1 from public.fundraiser_members m
          where m.fundraiser_id = f.id
            and m.profile_id = auth.uid()
            and m.accepted_at is not null
        )
      )
  );
$$;

create or replace function public.is_blocked_between(p_first uuid, p_second uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_first and blocked_id = p_second)
       or (blocker_id = p_second and blocked_id = p_first)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
  raw_name text;
begin
  generated_username := 'user_' || replace(substring(new.id::text from 1 for 8), '-', '');
  raw_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, generated_username), '@', 1)
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, generated_username, left(raw_name, 80));

  insert into public.user_roles (user_id, role) values (new.id, 'user');
  insert into public.referral_codes (code, owner_id)
  values ('g' || substring(replace(new.id::text, '-', '') from 1 for 11), new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_support_comment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.support_id is not null and not exists (
    select 1 from public.fundraiser_supports s
    where s.id = new.support_id
      and s.fundraiser_id = new.fundraiser_id
      and s.status = 'succeeded'
  ) then
    raise exception 'The attached support must be successful and belong to this fundraiser';
  end if;
  return new;
end;
$$;

create or replace function public.recalculate_fundraiser_totals(p_fundraiser_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_minor bigint;
  distinct_participants integer;
begin
  select
    coalesce(sum(amount_minor) filter (where status = 'succeeded'), 0),
    count(distinct supporter_id) filter (where status = 'succeeded' and supporter_id is not null)
  into total_minor, distinct_participants
  from public.fundraiser_supports
  where fundraiser_id = p_fundraiser_id;

  update public.fundraisers
  set current_amount_minor = total_minor,
      participant_count = distinct_participants,
      status = case
        when status = 'active' and total_minor >= target_amount_minor then 'goal_reached'::public.fundraiser_status
        else status
      end,
      updated_at = now()
  where id = p_fundraiser_id;
end;
$$;

create or replace function public.refresh_fundraiser_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_fundraiser_totals(old.fundraiser_id);
    return old;
  end if;

  perform public.recalculate_fundraiser_totals(new.fundraiser_id);

  -- Moving a support is not part of normal product flow, but this preserves
  -- totals if a trusted reconciliation process ever has to correct it.
  if tg_op = 'UPDATE' and old.fundraiser_id is distinct from new.fundraiser_id then
    perform public.recalculate_fundraiser_totals(old.fundraiser_id);
  end if;

  return new;
end;
$$;

-- Keep timestamps and denormalised public totals consistent.
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists wishes_updated_at on public.wishes;
create trigger wishes_updated_at before update on public.wishes for each row execute procedure public.set_updated_at();
drop trigger if exists fundraisers_updated_at on public.fundraisers;
create trigger fundraisers_updated_at before update on public.fundraisers for each row execute procedure public.set_updated_at();
drop trigger if exists supports_updated_at on public.fundraiser_supports;
create trigger supports_updated_at before update on public.fundraiser_supports for each row execute procedure public.set_updated_at();
drop trigger if exists comments_updated_at on public.fundraiser_comments;
create trigger comments_updated_at before update on public.fundraiser_comments for each row execute procedure public.set_updated_at();
drop trigger if exists comments_validate_support on public.fundraiser_comments;
create trigger comments_validate_support before insert or update of support_id, fundraiser_id on public.fundraiser_comments for each row execute procedure public.validate_support_comment();
drop trigger if exists supports_refresh_fundraiser on public.fundraiser_supports;
create trigger supports_refresh_fundraiser after insert or update of status, amount_minor, fundraiser_id or delete on public.fundraiser_supports for each row execute procedure public.refresh_fundraiser_totals();

-- Safe public presentation of supports. Amount and identity are intentionally
-- redacted according to a supporter's chosen visibility. Never query the raw
-- fundraiser_supports table from a feed or public fundraiser screen.
create or replace view public.fundraiser_support_activity
with (security_invoker = false)
as
select
  s.id,
  s.fundraiser_id,
  case when s.visibility = 'anonymous' then null else s.supporter_id end as supporter_id,
  case when s.visibility = 'anonymous' then null else p.username::text end as supporter_username,
  case when s.visibility = 'anonymous' then null else p.display_name end as supporter_display_name,
  case when s.visibility = 'exact' then s.amount_minor else null end as amount_minor,
  s.currency,
  s.visibility,
  s.message,
  s.succeeded_at,
  s.created_at
from public.fundraiser_supports s
join public.fundraisers f on f.id = s.fundraiser_id
left join public.profiles p on p.id = s.supporter_id
where s.status = 'succeeded'
  and f.visibility = 'public'
  and f.status in ('active', 'goal_reached', 'closed');

-- Public feed deliberately excludes unlisted and private collections.
create or replace view public.public_fundraiser_feed
with (security_invoker = false)
as
select
  f.id,
  f.slug::text as slug,
  f.author_id,
  f.wish_id,
  f.title,
  f.description,
  f.cover_image_path,
  f.category_slug,
  f.target_amount_minor,
  f.current_amount_minor,
  f.participant_count,
  f.currency,
  f.status,
  f.ends_at,
  f.published_at,
  f.created_at,
  p.username::text as author_username,
  p.display_name as author_display_name,
  p.avatar_path as author_avatar_path,
  case when p.show_city then p.city else null end as author_city
from public.fundraisers f
join public.profiles p on p.id = f.author_id
where f.visibility = 'public'
  and f.status in ('active', 'goal_reached', 'closed')
  and p.is_suspended = false;

-- RLS: tables default deny. Service-role and postgres bypass RLS for webhook,
-- moderation and background work; browser access is granted only by policies.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.profile_interests enable row level security;
alter table public.wishes enable row level security;
alter table public.fundraisers enable row level security;
alter table public.fundraiser_members enable row level security;
alter table public.user_follows enable row level security;
alter table public.fundraiser_follows enable row level security;
alter table public.fundraiser_supports enable row level security;
alter table public.fundraiser_comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_events enable row level security;

create policy "profiles are visible by preference" on public.profiles for select using (
  profile_visibility = 'public' or (profile_visibility = 'registered' and auth.uid() is not null) or id = auth.uid() or public.is_admin()
);
create policy "users can update their profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and not is_suspended);
create policy "moderators update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "users can read their role" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy "categories are readable" on public.categories for select using (is_active or public.is_admin());

create policy "interests are readable with visible profile" on public.profile_interests for select using (exists (select 1 from public.profiles p where p.id = profile_id));
create policy "users manage own interests" on public.profile_interests for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "wishes readable by visibility" on public.wishes for select using (visibility = 'public' or author_id = auth.uid() or public.is_admin());
create policy "users create own wishes" on public.wishes for insert with check (author_id = auth.uid());
create policy "users update own wishes" on public.wishes for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "users delete own wishes" on public.wishes for delete using (author_id = auth.uid());

create policy "fundraisers accessible by visibility" on public.fundraisers for select using (public.can_access_fundraiser(id) or public.is_admin());
create policy "users create own fundraisers" on public.fundraisers for insert with check (author_id = auth.uid());
create policy "authors update fundraisers" on public.fundraisers for update using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "authors delete draft fundraisers" on public.fundraisers for delete using ((author_id = auth.uid() and status = 'draft') or public.is_admin());

create policy "accepted members visible to collection accessors" on public.fundraiser_members for select using (
  (accepted_at is not null and public.can_access_fundraiser(fundraiser_id))
  or profile_id = auth.uid()
  or public.is_fundraiser_author(fundraiser_id)
  or public.is_admin()
);
create policy "authors invite members" on public.fundraiser_members for insert with check (public.is_fundraiser_author(fundraiser_id) or public.is_admin());
create policy "members accept own invite" on public.fundraiser_members for update using (profile_id = auth.uid() or public.is_fundraiser_author(fundraiser_id) or public.is_admin()) with check (profile_id = auth.uid() or public.is_fundraiser_author(fundraiser_id) or public.is_admin());
create policy "authors remove members" on public.fundraiser_members for delete using (public.is_fundraiser_author(fundraiser_id) or public.is_admin());

create policy "follows are readable" on public.user_follows for select using (true);
create policy "users follow from own account" on public.user_follows for insert with check (follower_id = auth.uid());
create policy "users remove own follows" on public.user_follows for delete using (follower_id = auth.uid());
create policy "fundraiser follows accessible with fundraiser" on public.fundraiser_follows for select using (public.can_access_fundraiser(fundraiser_id) or profile_id = auth.uid());
create policy "users follow accessible fundraisers" on public.fundraiser_follows for insert with check (profile_id = auth.uid() and public.can_access_fundraiser(fundraiser_id));
create policy "users remove own fundraiser follows" on public.fundraiser_follows for delete using (profile_id = auth.uid());

create policy "supporter or author sees raw support" on public.fundraiser_supports for select using (supporter_id = auth.uid() or public.is_fundraiser_author(fundraiser_id) or public.is_admin());

create policy "comments accessible with fundraiser" on public.fundraiser_comments for select using ((not is_hidden and deleted_at is null and public.can_access_fundraiser(fundraiser_id)) or author_id = auth.uid() or public.is_fundraiser_author(fundraiser_id) or public.is_admin());
create policy "users add comments to accessible fundraiser" on public.fundraiser_comments for insert with check (author_id = auth.uid() and public.can_access_fundraiser(fundraiser_id) and not public.is_blocked_between(author_id, (select author_id from public.fundraisers where id = fundraiser_id)));
create policy "authors edit recent comments" on public.fundraiser_comments for update using (author_id = auth.uid() and created_at > now() - interval '15 minutes') with check (author_id = auth.uid());
create policy "moderators hide comments" on public.fundraiser_comments for update using (public.is_admin()) with check (public.is_admin());
create policy "authors delete own comments" on public.fundraiser_comments for delete using (author_id = auth.uid() or public.is_admin());

create policy "conversation members can view conversation" on public.conversations for select using (exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.profile_id = auth.uid()));
create policy "conversation members see members" on public.conversation_members for select using (exists (select 1 from public.conversation_members own where own.conversation_id = conversation_id and own.profile_id = auth.uid()));
create policy "members update own conversation state" on public.conversation_members for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "members see messages" on public.messages for select using (exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.profile_id = auth.uid()));
create policy "members send messages" on public.messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.profile_id = auth.uid()));

create policy "users see own notifications" on public.notifications for select using (recipient_id = auth.uid());
create policy "users mark own notifications" on public.notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "users see own blocks" on public.blocks for select using (blocker_id = auth.uid());
create policy "users create own blocks" on public.blocks for insert with check (blocker_id = auth.uid());
create policy "users remove own blocks" on public.blocks for delete using (blocker_id = auth.uid());

create policy "users create reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reporters see own reports" on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "moderators manage reports" on public.reports for update using (public.is_admin()) with check (public.is_admin());
create policy "moderators see actions" on public.moderation_actions for select using (public.is_admin());
create policy "moderators add actions" on public.moderation_actions for insert with check (moderator_id = auth.uid() and public.is_admin());

create policy "users see own referral code" on public.referral_codes for select using (owner_id = auth.uid() or is_active);
create policy "users see own referrals" on public.referrals for select using (referrer_id = auth.uid() or referee_id = auth.uid() or public.is_admin());
create policy "users see own referral events" on public.referral_events for select using (exists (select 1 from public.referrals r where r.id = referral_id and (r.referrer_id = auth.uid() or r.referee_id = auth.uid() or public.is_admin())));

-- The two presentation views are intentionally readable by anonymous visitors.
grant select on public.fundraiser_support_activity, public.public_fundraiser_feed to anon, authenticated;
grant execute on function public.is_admin(), public.is_fundraiser_author(uuid), public.can_access_fundraiser(uuid), public.is_blocked_between(uuid, uuid) to anon, authenticated;

-- Subscribe only the chat and notifications; payments are updated after verified
-- callbacks and feed totals are received as normal database updates.
alter publication supabase_realtime add table public.fundraiser_comments, public.notifications;
