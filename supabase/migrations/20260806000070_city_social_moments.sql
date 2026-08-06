-- Opt-in city social moments. No private action becomes a city event unless
-- every involved public participant explicitly allows it in settings.
alter table public.profiles
  add column if not exists share_city_moments boolean not null default false;

create table if not exists public.city_social_moments (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  kind text not null check (kind in ('place_join', 'place_gift', 'profile_gift', 'live_gift', 'live_donation')),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.profiles(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  live_room_id uuid references public.live_rooms(id) on delete set null,
  gift_code text references public.virtual_gifts(code) on delete set null,
  created_at timestamptz not null default now(),
  check (subject_id is null or actor_id <> subject_id)
);
create index if not exists city_social_moments_city_created_idx
  on public.city_social_moments (city_id, created_at desc);

alter table public.city_social_moments enable row level security;
-- Writes are server-only through a policy-free admin client. The public safe
-- view below performs the consent and public-profile filtering.

create or replace view public.public_city_social_moments
with (security_invoker = false)
as
select
  moment.city_id,
  moment.kind,
  actor.id as actor_id,
  actor.display_name as actor_name,
  actor.username::text as actor_username,
  actor.avatar_path as actor_avatar_path,
  case
    when moment.kind = 'place_join' then place.name
    when moment.kind = 'place_gift' then coalesce(subject.display_name, 'участнику') || coalesce(' · ' || place.name, '')
    when moment.kind = 'profile_gift' then coalesce(subject.display_name, 'участнику')
    when moment.kind in ('live_gift', 'live_donation') then coalesce(room.title, 'эфир')
    else 'городе'
  end as target_name,
  moment.place_id as target_id,
  case when moment.kind in ('live_gift', 'live_donation') then room.slug else null end as target_slug,
  moment.created_at
from public.city_social_moments moment
join public.profiles actor on actor.id = moment.actor_id
left join public.profiles subject on subject.id = moment.subject_id
left join public.places place on place.id = moment.place_id
left join public.live_rooms room on room.id = moment.live_room_id
where actor.profile_visibility = 'public'
  and actor.show_city = true
  and actor.share_city_moments = true
  and actor.city_id = moment.city_id
  and (
    moment.subject_id is null
    or (
      subject.profile_visibility = 'public'
      and subject.show_city = true
      and subject.share_city_moments = true
      and subject.city_id = moment.city_id
    )
  );

grant select on public.public_city_social_moments to anon, authenticated;

alter publication supabase_realtime add table public.city_social_moments;
