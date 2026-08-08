-- Gift collections wave 2: two more items in each of the first five
-- collections (cute, brutal, glamour, nerd, sport) — same luminous 2D art.

insert into public.collectible_artifact_series
  (slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars, sort_order, collection_slug)
values
  ('donut', 'Пончик', 'Мимимишный пончик с глазурью и посыпкой.', '/collectibles/gems/png/donut.png', 'limited', 300, 300, 49, 41, 'cute'),
  ('panda', 'Панда', 'Мимимишная панда с большими глазами.', '/collectibles/gems/png/panda.png', 'rare', 100, 100, 119, 42, 'cute'),
  ('hammer', 'Молот', 'Брутальный молот с искрами.', '/collectibles/gems/png/hammer.png', 'limited', 250, 250, 59, 43, 'brutal'),
  ('fist', 'Кулак', 'Брутальный кулак с огненным свечением.', '/collectibles/gems/png/fist.png', 'rare', 80, 80, 149, 44, 'brutal'),
  ('shoe', 'Туфелька', 'Гламурная туфелька в золотом свете.', '/collectibles/gems/png/shoe.png', 'limited', 200, 200, 69, 45, 'glamour'),
  ('bag', 'Сумочка', 'Гламурная сумочка с золотой фурнитурой.', '/collectibles/gems/png/bag.png', 'rare', 60, 60, 179, 46, 'glamour'),
  ('flask', 'Пробирка', 'Ботаническая пробирка со светящейся жидкостью.', '/collectibles/gems/png/flask.png', 'limited', 180, 180, 79, 47, 'nerd'),
  ('glasses', 'Очки', 'Ботанические очки с синим бликом.', '/collectibles/gems/png/glasses.png', 'rare', 100, 100, 119, 48, 'nerd'),
  ('dumbbell', 'Гантеля', 'Спортивная гантеля в оранжевом свечении.', '/collectibles/gems/png/dumbbell.png', 'limited', 150, 150, 89, 49, 'sport'),
  ('boxing', 'Перчатка', 'Боксёрская перчатка с динамикой.', '/collectibles/gems/png/boxing.png', 'rare', 80, 80, 149, 50, 'sport')
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
