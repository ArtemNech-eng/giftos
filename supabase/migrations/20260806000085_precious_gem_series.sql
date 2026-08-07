-- Precious gem series: a second collection in a different visual language —
-- glowing, diamond-faceted gem illustrations with radiant light (2D premium
-- art, not ceramic figures). Transparent PNG art, animated in the UI.

insert into public.collectible_artifact_series
  (slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars, sort_order)
values
  ('amethyst', 'Аметист', 'Фиолетовый камень из драгоценной серии.', '/collectibles/gems/png/amethyst.png', 'limited', 300, 300, 49, 21),
  ('topaz', 'Топаз', 'Золотистый камень из драгоценной серии.', '/collectibles/gems/png/topaz.png', 'limited', 250, 250, 59, 22),
  ('opal', 'Опал', 'Переливающийся камень из драгоценной серии.', '/collectibles/gems/png/opal.png', 'limited', 200, 200, 69, 23),
  ('pearl', 'Жемчуг', 'Мягко сияющая жемчужина.', '/collectibles/gems/png/pearl.png', 'limited', 180, 180, 79, 24),
  ('amber', 'Янтарь', 'Тёплый янтарный камень.', '/collectibles/gems/png/amber.png', 'limited', 150, 150, 89, 25),
  ('sapphire', 'Сапфир', 'Глубокий синий камень.', '/collectibles/gems/png/sapphire.png', 'rare', 100, 100, 119, 26),
  ('emerald', 'Изумруд', 'Богатый зелёный камень.', '/collectibles/gems/png/emerald.png', 'rare', 80, 80, 149, 27),
  ('moonstone', 'Лунный камень', 'Эфирное сияние лунного света.', '/collectibles/gems/png/moonstone.png', 'rare', 60, 60, 179, 28),
  ('ruby', 'Рубин', 'Пылающий красный камень.', '/collectibles/gems/png/ruby.png', 'iconic', 40, 40, 249, 29),
  ('diamond', 'Бриллиант', 'Самый сияющий камень коллекции.', '/collectibles/gems/png/diamond.png', 'iconic', 25, 25, 329, 30)
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
