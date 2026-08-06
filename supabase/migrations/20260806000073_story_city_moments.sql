-- Opt-in public story support is a city media moment, not an implicit
-- disclosure of a payment or private relationship.
alter table public.city_social_moments
  add column if not exists story_id uuid references public.stories(id) on delete set null;

alter table public.city_social_moments
  drop constraint if exists city_social_moments_kind_check;
alter table public.city_social_moments
  add constraint city_social_moments_kind_check
  check (kind in ('place_join', 'place_gift', 'profile_gift', 'live_gift', 'live_donation', 'story_gift'));

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
    when moment.kind = 'story_gift' then coalesce(story.caption, 'story автора')
    else 'городе'
  end as target_name,
  coalesce(moment.place_id, moment.story_id) as target_id,
  case when moment.kind in ('live_gift', 'live_donation') then room.slug else null end as target_slug,
  moment.created_at
from public.city_social_moments moment
join public.profiles actor on actor.id = moment.actor_id
left join public.profiles subject on subject.id = moment.subject_id
left join public.places place on place.id = moment.place_id
left join public.live_rooms room on room.id = moment.live_room_id
left join public.stories story on story.id = moment.story_id
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
