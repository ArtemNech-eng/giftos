# Чек-лист запуска self-hosted стенда (РФ)

**Цель:** поднять тестовый контур в российской инфраструктуре, применить 100 миграций, прогнать сценарии QA и войти в закрытую бета-фазу Будённовска. Ниже — точный порядок действий. Никаких секретов в чат: env заполняются только локально на сервере.

## Фаза 0. Подготовка (до сервера)

- [ ] Выбрать хостинг (Timeweb / VK Cloud / Selectel) и регион в РФ.
- [ ] VPS: ≥ 2 vCPU / 4 ГБ RAM / 40 ГБ SSD (Supabase + LiveKit помещаются).
- [ ] Домен (например, `api.hochutakzhe.ru`) с доступом к DNS.
- [ ] Репозиторий на сервере: `git clone https://github.com/ArtemNech-eng/giftos.git && cd giftos && npm ci`.

## Фаза 1. Supabase (self-hosted)

- [ ] Docker + docker-compose на сервере.
- [ ] Развернуть [supabase/docker](https://github.com/supabase/supabase/tree/master/docker) (auth, postgres, storage, realtime, rest).
- [ ] Выставить `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET` — в `.env` сервера.
- [ ] Применить миграции: `npm run qa:migrations` (должно показать 100, без пропусков).
- [ ] Прогнать `npm run qa:selfhosted` — preflight должен пройти без missing-ошибок.
- [ ] Проверить Storage buckets (avatars, profile-media, wish-media, fundraiser-media, story-media) и RLS. Арты коллекций — статика в `public/collectibles` (30 PNG), bucket не нужен.

## Фаза 2. Приложение

- [ ] Скопировать `.env.example` → `.env.local` на сервере.
- [ ] Заполнить: `NEXT_PUBLIC_SUPABASE_URL` (https://api…), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- [ ] Собрать: `npm run build`.
- [ ] Запустить production: `npm run start` (или PM2/systemd; порт 3000).
- [ ] Настроить reverse-proxy (nginx/caddy) с TLS на домен приложения.

## Фаза 3. Сценарный QA (docs/SELF_HOSTED_SCENARIO_QA.md)

- [ ] Регистрация → onboarding (город Будённовск) → лента.
- [ ] Желание → «Хочу также» → сбор → тестовая поддержка.
- [ ] Место → присутствие → сообщение → эфир в месте → событие.
- [ ] Story: загрузка/съёмка → мгновенная публикация → жалоба → скрытие в админке.
- [ ] ⭐: бонусы за реферала, магазин, VIP, лимиты трат.
- [ ] Артефакт: покупка → подарок/запрос автору → accept → ledger 80/20.
- [ ] Админка: дашборд, пользователи (бан/роль), настройки, журнал действий.
- [ ] Только synthetic-аккаунты; реальных пользователей не создавать до беты.

## Фаза 4. LiveKit (опционально, для реального видео)

- [ ] Развернуть LiveKit server (docker) на отдельном домене/порту.
- [ ] Заполнить `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
- [ ] Проверить `/live` — видеотранспорт вместо placeholder.

## Фаза 5. Закрытая бета Будённовска

- [ ] Создать первого админа (вставить роль `admin` в `user_roles` напрямую через SQL).
- [ ] Пригласить 10–20 первых жителей по реферальным ссылкам.
- [ ] Включить web push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`.
- [ ] Настроить Dadata (`DADATA_API_KEY`) для IP-гео.

## После беты (НЕ раньше)

- [ ] Юридическая подготовка (оферта, 18+, KYC).
- [ ] Платёжный партнёр (реальные ⭐-покупки, вывод авторам).
- [ ] FFmpeg-воркер для транскодинга видео (сейчас test-заглушка).
