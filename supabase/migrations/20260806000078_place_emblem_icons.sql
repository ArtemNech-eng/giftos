-- Pre-production icon-system migration for place emblems (same pattern as
-- places.icon_code and virtual_items.icon_code): presentation moves from OS
-- emoji to stable semantic icon codes. The emoji column stays only for
-- reproducibility of older migrations.

alter table public.place_emblems
  add column if not exists icon_code text;

update public.place_emblems
set icon_code = case
  when name = 'Лапа' then 'paw'
  when name = 'Корона' then 'crown'
  when name = 'Молния' then 'zap'
  when name = 'Сердце' then 'heart'
  else 'star'
end
where icon_code is null;

alter table public.place_emblems
  alter column icon_code set default 'star',
  alter column icon_code set not null;

alter table public.place_emblems
  drop constraint if exists place_emblems_icon_code_check;
alter table public.place_emblems
  add constraint place_emblems_icon_code_check
  check (icon_code in ('paw', 'crown', 'zap', 'heart', 'star'));
