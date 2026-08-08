-- Gift collections: thematic series «подарок под характер человека».
-- Adds collection_slug to artifact series and seeds 10 flagship items,
-- one per collection (cute, brutal, glamour, nerd, sport, racer, street,
-- beauty, attention, mafia). Existing gems get collection 'gems'.

alter table public.collectible_artifact_series
  add column if not exists collection_slug text;

update public.collectible_artifact_series
set collection_slug = 'gems'
where collection_slug is null and artwork_path like '%/gems/%';

insert into public.collectible_artifact_series
  (slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars, sort_order, collection_slug)
values
  ('cat', 'Котик', 'Мимимишный котёнок, светящийся нежностью.', '/collectibles/gems/png/cat.png', 'limited', 300, 300, 49, 31, 'cute'),
  ('skull', 'Череп', 'Брутальный череп с холодным свечением.', '/collectibles/gems/png/skull.png', 'limited', 250, 250, 59, 32, 'brutal'),
  ('lipstick', 'Помада', 'Гламурная помада в золотом свете.', '/collectibles/gems/png/lipstick.png', 'limited', 200, 200, 69, 33, 'glamour'),
  ('atom', 'Атом', 'Ботанический атом с орбитами и искрами.', '/collectibles/gems/png/atom.png', 'limited', 180, 180, 79, 34, 'nerd'),
  ('ball', 'Мяч', 'Спортивный мяч в оранжевом свечении.', '/collectibles/gems/png/ball.png', 'limited', 150, 150, 89, 35, 'sport'),
  ('helmet', 'Шлем', 'Гоночный шлем на адреналине.', '/collectibles/gems/png/helmet.png', 'rare', 100, 100, 119, 36, 'racer'),
  ('cap', 'Кепка', 'Уличная кепка с граффити-свечением.', '/collectibles/gems/png/cap.png', 'rare', 80, 80, 149, 37, 'street'),
  ('butterfly', 'Бабочка', 'Красотка-бабочка с искрящейся пыльцой.', '/collectibles/gems/png/butterfly.png', 'rare', 60, 60, 179, 38, 'beauty'),
  ('spotlight', 'Прожектор', 'Луч внимания для тех, кто хочет сиять.', '/collectibles/gems/png/spotlight.png', 'iconic', 40, 40, 249, 39, 'attention'),
  ('hat', 'Шляпа', 'Мафиозная шляпа с золотым ободком.', '/collectibles/gems/png/hat.png', 'iconic', 25, 25, 329, 40, 'mafia')
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

create index if not exists collectible_artifact_series_collection_idx
  on public.collectible_artifact_series (collection_slug, sort_order);
