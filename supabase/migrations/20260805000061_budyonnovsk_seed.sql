-- Budyonnovsk launch seeds: synthetic demo data so the city, places,
-- rankings and hangouts feel alive during the first weeks.
-- Profiles are created through the on_auth_user_created trigger; the demo
-- accounts cannot sign in (encrypted_password is a random hash).

-- 1. Demo users (auth.users -> profiles via trigger).
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
select
  v.id,
  v.email,
  crypt('seed-only-' || v.id::text, gen_salt('bf')),
  now(),
  jsonb_build_object('display_name', v.display_name),
  now(),
  now()
from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, 'alex@seed.local', 'Алексей'),
  ('00000000-0000-0000-0000-000000000102'::uuid, 'maria@seed.local', 'Мария'),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'kirill@seed.local', 'Кирилл'),
  ('00000000-0000-0000-0000-000000000104'::uuid, 'nastya@seed.local', 'Настя'),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'denis@seed.local', 'Денис'),
  ('00000000-0000-0000-0000-000000000106'::uuid, 'olga@seed.local', 'Ольга'),
  ('00000000-0000-0000-0000-000000000107'::uuid, 'igor@seed.local', 'Игорь'),
  ('00000000-0000-0000-0000-000000000108'::uuid, 'sveta@seed.local', 'Светлана')
) as v(id, email, display_name)
on conflict (id) do nothing;

-- 2. Complete profiles: names, bios, city, interests, creator flags.
update public.profiles p set
  username = v.username,
  display_name = v.display_name,
  bio = v.bio,
  city = 'Будённовск',
  city_id = (select id from public.cities where normalized_name = 'буденновск'),
  show_city = true,
  is_creator = v.is_creator,
  creator_headline = v.headline,
  onboarding_completed_at = now(),
  updated_at = now()
from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, 'alex', 'Алексей', 'Люблю музыку и эфиры, собираю свою тусовку.', true, 'Веду эфиры по вечерам'),
  ('00000000-0000-0000-0000-000000000102'::uuid, 'maria', 'Мария', 'Рисую, путешествую, мечтаю о фотоаппарате.', true, 'Автор и художница'),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'kirill', 'Кирилл', 'Геймер, люблю турниры и игровые ночи.', false, null),
  ('00000000-0000-0000-0000-000000000104'::uuid, 'nastya', 'Настя', 'Танцую и веду подкаст о городе.', true, 'Голос Будённовска'),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'denis', 'Денис', 'Спорт, бег по утрам, здоровый образ жизни.', false, null),
  ('00000000-0000-0000-0000-000000000106'::uuid, 'olga', 'Ольга', 'Книги, кофе, уютные вечера.', false, null),
  ('00000000-0000-0000-0000-000000000107'::uuid, 'igor', 'Игорь', 'Собираю гитару, учусь играть.', true, 'Музыкант по выходным'),
  ('00000000-0000-0000-0000-000000000108'::uuid, 'sveta', 'Светлана', 'Фотограф, ищу вдохновение рядом.', false, null)
) as v(id, username, display_name, bio, is_creator, headline)
where p.id = v.id;

-- 3. Interests (categories exist from the initial schema).
insert into public.profile_interests (profile_id, category_slug)
select p.id, i.slug
from public.profiles p
join (values
  ('00000000-0000-0000-0000-000000000101'::uuid, 'music'),
  ('00000000-0000-0000-0000-000000000102'::uuid, 'hobbies'),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'games'),
  ('00000000-0000-0000-0000-000000000104'::uuid, 'music'),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'sport'),
  ('00000000-0000-0000-0000-000000000106'::uuid, 'education'),
  ('00000000-0000-0000-0000-000000000107'::uuid, 'music'),
  ('00000000-0000-0000-0000-000000000108'::uuid, 'hobbies')
) as i(id, slug) on i.id = p.id
where not exists (
  select 1 from public.profile_interests pi
  where pi.profile_id = p.id and pi.category_slug = i.slug
);

-- 4. Wishes.
insert into public.wishes (author_id, title, description, category_slug, estimated_cost_minor, visibility)
select
  v.author_id, v.title, v.description, v.category_slug, v.cost, 'public'
from (values
  ('00000000-0000-0000-0000-000000000102'::uuid, 'Новый фотоаппарат для съёмок', 'Мечтаю снимать город и людей.', 'hobbies', 6000000),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'Кроссовки для марафона', 'Готовлюсь к полумарафону.', 'sport', 1500000),
  ('00000000-0000-0000-0000-000000000107'::uuid, 'Акустическая гитара', 'Хочу играть для друзей.', 'music', 8000000),
  ('00000000-0000-0000-0000-000000000106'::uuid, 'Поездка в Санкт-Петербург', 'Мечтаю увидеть разводные мосты.', 'travel', 4000000),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'Игровой компьютер', 'Чтобы играть в новые игры.', 'games', 12000000)
) as v(author_id, title, description, category_slug, cost)
on conflict do nothing;

-- 5. A couple of fundraisers tied to wishes.
insert into public.fundraisers (author_id, wish_id, slug, title, description, category_slug, target_amount_minor, current_amount_minor, visibility, status, published_at)
select
  p.id,
  w.id,
  'seed-' || left(replace(p.id::text, '-', ''), 8),
  w.title,
  w.description,
  w.category_slug,
  w.estimated_cost_minor,
  0,
  'public',
  'active',
  now()
from public.wishes w
join public.profiles p on p.id = w.author_id
where w.title = 'Новый фотоаппарат для съёмок' or w.title = 'Акустическая гитара'
on conflict (slug) do nothing;

-- 6. Personal hangout + a temporary one (in Budyonnovsk).
insert into public.places (city_id, creator_id, name, description, emoji, kind)
select
  c.id,
  p.id,
  v.name,
  v.description,
  v.emoji,
  v.kind
from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, 'Наша тусовка', 'Компания Алексея: эфиры, музыка, свои люди.', '🏠', 'personal'),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'CS пацаны', 'Игровые вечера и турниры.', '🎮', 'personal'),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'Бегаем по утрам', 'Совместные пробежки по городу.', '🏃', 'temporary')
) as v(creator_id, name, description, emoji, kind)
join public.profiles p on p.id = v.creator_id
cross join public.cities c on c.normalized_name = 'буденновск'
on conflict do nothing;

-- 7. Place members and presence (so counters are non-zero).
insert into public.place_members (place_id, profile_id, role)
select pl.id, p.id, case when pl.creator_id = p.id then 'creator' else 'member' end
from public.places pl
cross join public.profiles p
where pl.city_id = (select id from public.cities where normalized_name = 'буденновск')
  and pl.kind <> 'fixed'
  and p.id in ('00000000-0000-0000-0000-000000000101'::uuid,'00000000-0000-0000-0000-000000000102'::uuid,'00000000-0000-0000-0000-000000000103'::uuid,'00000000-0000-0000-0000-000000000104'::uuid,'00000000-0000-0000-0000-000000000105'::uuid)
on conflict (place_id, profile_id) do nothing;

insert into public.place_presence (place_id, profile_id, entered_at, last_seen_at, last_read_at)
select pl.id, p.id, now() - interval '10 minutes', now() - interval '2 minutes', now()
from public.places pl
cross join public.profiles p
where pl.city_id = (select id from public.cities where normalized_name = 'буденновск')
  and pl.kind <> 'fixed'
  and p.id in ('00000000-0000-0000-0000-000000000101'::uuid,'00000000-0000-0000-0000-000000000102'::uuid,'00000000-0000-0000-0000-000000000103'::uuid,'00000000-0000-0000-0000-000000000104'::uuid)
on conflict (place_id, profile_id) do update set last_seen_at = excluded.last_seen_at;

-- 8. Some messages in the fixed places so chats are alive.
insert into public.place_messages (place_id, author_id, body)
select
  pl.id,
  p.id,
  v.body
from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, 'Центр', 'Кто сегодня в городе? 😄'),
  ('00000000-0000-0000-0000-000000000102'::uuid, 'Центр', 'Я тут! Может, вечером кофе?'),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'Ночная', 'Кто не спит — отзовитесь 🌙'),
  ('00000000-0000-0000-0000-000000000104'::uuid, 'Музыка', 'Ставлю плейлист на вечер 🎵')
) as v(author_id, place_name, body)
join public.places pl on pl.name = v.place_name
  and pl.city_id = (select id from public.cities where normalized_name = 'буденновск')
join public.profiles p on p.id = v.author_id
on conflict do nothing;

-- 9. Some follows so rankings/levels have data.
insert into public.user_follows (follower_id, following_id)
select f.id, t.id
from public.profiles f
cross join public.profiles t
where f.id <> t.id
  and f.id in ('00000000-0000-0000-0000-000000000101'::uuid,'00000000-0000-0000-0000-000000000102'::uuid,'00000000-0000-0000-0000-000000000103'::uuid)
  and t.id in ('00000000-0000-0000-0000-000000000101'::uuid,'00000000-0000-0000-0000-000000000102'::uuid,'00000000-0000-0000-0000-000000000104'::uuid,'00000000-0000-0000-0000-000000000107'::uuid)
on conflict do nothing;

-- 10. An event in the city.
insert into public.events (author_id, city_id, title, description, event_type, scope, starts_at)
select
  p.id,
  c.id,
  'Встреча Будённовска',
  'Знакомимся, общаемся, планируем совместные эфиры.',
  'meetup',
  'local',
  now() + interval '3 days'
from public.profiles p
join public.cities c on c.normalized_name = 'буденновск'
where p.id = '00000000-0000-0000-0000-000000000104'::uuid
on conflict do nothing;
