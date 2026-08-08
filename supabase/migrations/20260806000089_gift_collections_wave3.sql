-- Gift collections wave 3: two more items in each of the remaining five
-- collections (racer, street, beauty, attention, mafia).

insert into public.collectible_artifact_series
  (slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars, sort_order, collection_slug)
values
  ('racecar', 'Болид', 'Гоночный болид в огненном свечении.', '/collectibles/gems/png/racecar.png', 'limited', 200, 200, 69, 51, 'racer'),
  ('lightning', 'Молния', 'Золотая молния со скоростью.', '/collectibles/gems/png/lightning.png', 'rare', 80, 80, 149, 52, 'racer'),
  ('sneaker', 'Кроссовок', 'Уличный кроссовок со свечением.', '/collectibles/gems/png/sneaker.png', 'limited', 200, 200, 69, 53, 'street'),
  ('boombox', 'Бумбокс', 'Ретро-бумбокс с волнами звука.', '/collectibles/gems/png/boombox.png', 'rare', 80, 80, 149, 54, 'street'),
  ('mirror', 'Зеркальце', 'Зеркальце с розовым сиянием.', '/collectibles/gems/png/mirror.png', 'limited', 200, 200, 69, 55, 'beauty'),
  ('heart2', 'Сердечко', 'Глянцевое сердечко с искрами.', '/collectibles/gems/png/heart2.png', 'rare', 80, 80, 149, 56, 'beauty'),
  ('mic', 'Микрофон', 'Микрофон в золотом луче.', '/collectibles/gems/png/mic.png', 'limited', 200, 200, 69, 57, 'attention'),
  ('firework', 'Салют', 'Салют, который не останется незамеченным.', '/collectibles/gems/png/firework.png', 'rare', 80, 80, 149, 58, 'attention'),
  ('cards', 'Карты', 'Мафиозные карты с золотым свечением.', '/collectibles/gems/png/cards.png', 'limited', 200, 200, 69, 59, 'mafia'),
  ('briefcase', 'Чемоданчик', 'Классический чемоданчик серьёзных дел.', '/collectibles/gems/png/briefcase.png', 'rare', 80, 80, 149, 60, 'mafia')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  artwork_path = excluded.artwork_path,
  rarity = excluded.rarity,
  total_edition = excluded.total_edition,
  remaining_edition = excluded.remaining_edition,
  price_stars = excluded.price_stars,
  sort_order = excluded.sort_order,
  collection_slug = excluded.collection_slug,
  updated_at = now();
