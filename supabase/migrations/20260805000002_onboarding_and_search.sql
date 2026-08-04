-- Product slice 1: onboarding completion and lightweight discovery indexes.
-- A profile is created by handle_new_user; this timestamp is set only when a user
-- finishes the mandatory public-profile setup flow.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

create index if not exists profiles_discovery_idx
  on public.profiles (created_at desc)
  where profile_visibility = 'public' and not is_suspended;

-- Initial search uses PostgreSQL full-text search. It intentionally indexes only
-- public content; richer ranking can be introduced after real activity exists.
alter table public.wishes
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored;

alter table public.fundraisers
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored;

create index if not exists wishes_search_document_idx on public.wishes using gin (search_document);
create index if not exists fundraisers_search_document_idx on public.fundraisers using gin (search_document);
