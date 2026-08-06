-- Seed fixed places for the launch city (Budyonnovsk).
insert into public.places (city_id, name, description, emoji, kind)
select
  c.id,
  v.name,
  v.description,
  v.emoji,
  'fixed'
from (values
  ('Центр', 'Главное место города: здесь всегда кто-то есть.', '🏙'),
  ('Музыка', 'Музыка, концерты и совместные прослушивания.', '🎵'),
  ('Игровая', 'Игры, турниры и геймеры.', '🎮'),
  ('Ночная', 'Кто не спит — тот здесь. Разговоры до утра.', '🌙'),
  ('Знакомства', 'Знакомства и общение.', '❤️'),
  ('Спорт', 'Спорт, тренировки и активный отдых.', '🏋️')
) as v(name, description, emoji)
join public.cities c on c.normalized_name = 'буденновск'
on conflict do nothing;
