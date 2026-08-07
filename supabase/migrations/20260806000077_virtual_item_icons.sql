-- Pre-production icon-system migration for the star shop (same pattern as
-- places.icon_code in migration 69): screens move from OS emoji to stable
-- semantic icon codes immediately. The old emoji column stays only so older
-- migrations remain reproducible; presentation no longer depends on it.

alter table public.virtual_items
  add column if not exists icon_code text;

update public.virtual_items
set icon_code = case
  when name = 'Значок «Огонёк»' then 'fire'
  when name = 'Значок «Звезда»' then 'star'
  when name = 'Рамка «Розовая»' then 'rose'
  when name = 'Рамка «Неон»' then 'neon'
  when name = 'Эффект «Блёстки»' then 'sparkle'
  when name = 'Эффект «Огонь»' then 'flame'
  when name = 'Тема «Ночь»' then 'night'
  when name = 'Тема «Космос»' then 'space'
  when name = 'Значок «Первая волна»' then 'wave'
  when name = 'Рамка «Золото»' then 'gold'
  when name = 'Эффект «Радуга»' then 'rainbow'
  when item_type = 'badge' then 'star'
  when item_type = 'avatar_frame' then 'frame'
  when item_type = 'effect' then 'sparkle'
  when item_type = 'profile_theme' then 'palette'
end
where icon_code is null;

alter table public.virtual_items
  alter column icon_code set default 'star',
  alter column icon_code set not null;

alter table public.virtual_items
  drop constraint if exists virtual_items_icon_code_check;
alter table public.virtual_items
  add constraint virtual_items_icon_code_check
  check (icon_code in (
    'fire', 'star', 'rose', 'neon', 'sparkle', 'flame',
    'night', 'space', 'wave', 'gold', 'rainbow',
    'frame', 'palette'
  ));
