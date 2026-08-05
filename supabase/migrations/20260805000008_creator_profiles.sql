-- «Хочу также» flagship: any user can opt into a creator page before
-- monetisation features are enabled. Paid operations stay disabled until age,
-- KYC and payment-partner checks are implemented.

alter table public.profiles
  add column if not exists is_creator boolean not null default false,
  add column if not exists creator_headline text check (creator_headline is null or char_length(creator_headline) <= 160);

create index if not exists profiles_creator_discovery_idx
  on public.profiles (created_at desc)
  where is_creator and profile_visibility = 'public' and not is_suspended;
