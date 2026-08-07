-- Collection expansion: second wave of premium objects (bear, rose, ring,
-- car, heart, star, butterfly, skate, shell, crown) in the same ceramic
-- art-toy language, transparent PNG art, animated in the UI.

insert into public.collectible_artifact_series
  (slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars, sort_order)
values
  ('bear', 'Мишка', 'Мягкая керамическая фигура с золотым бантом.', '/collectibles/artifacts/png/bear.png', 'limited', 300, 300, 49, 11),
  ('rose', 'Роза', 'Керамическая роза с золотыми прожилками.', '/collectibles/artifacts/png/rose.png', 'limited', 250, 250, 59, 12),
  ('heart', 'Сердце', 'Глянцевое сердце с золотой линией.', '/collectibles/artifacts/png/heart.png', 'limited', 200, 200, 69, 13),
  ('butterfly', 'Бабочка', 'Деликатная фигура с золотыми прожилками крыльев.', '/collectibles/artifacts/png/butterfly.png', 'limited', 180, 180, 79, 14),
  ('skate', 'Скейт', 'Мини-скейт с золотыми колёсами.', '/collectibles/artifacts/png/skate.png', 'limited', 150, 150, 89, 15),
  ('ring', 'Кольцо', 'Кольцо с розовым камнем и золотым ободком.', '/collectibles/artifacts/png/ring.png', 'rare', 100, 100, 119, 16),
  ('car', 'Машина', 'Ретро-машина с золотыми деталями.', '/collectibles/artifacts/png/car.png', 'rare', 80, 80, 149, 17),
  ('star', 'Звезда', 'Звезда со светящимися золотыми гранями.', '/collectibles/artifacts/png/star.png', 'rare', 60, 60, 179, 18),
  ('shell', 'Ракушка', 'Жемчужная ракушка с золотым ободком.', '/collectibles/artifacts/png/shell.png', 'iconic', 40, 40, 249, 19),
  ('crown', 'Корона', 'Корона с розовыми камнями.', '/collectibles/artifacts/png/crown.png', 'iconic', 25, 25, 329, 20)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  artwork_path = excluded.artwork_path,
  rarity = excluded.rarity,
  total_edition = excluded.total_edition,
  remaining_edition = excluded.remaining_edition,
  price_stars = excluded.price_stars,
  sort_order = excluded.sort_order,
  updated_at = now();
