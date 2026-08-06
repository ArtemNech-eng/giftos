import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CirclePlus,
  Gift,
  MessageCircle,
  Search,
  Send,
  UserRound,
  Video,
} from "lucide-react";

export const metadata = {
  title: "Preview кабинета",
  robots: { index: false, follow: false },
};

const screens = [
  { id: "feed", label: "Главная", icon: "⌂" },
  { id: "profile", label: "Профиль", icon: "◉" },
  { id: "earnings", label: "Доход", icon: "₽" },
  { id: "bonuses", label: "Рефералы", icon: "✦" },
  { id: "messages", label: "Сообщения", icon: "◌" },
  { id: "live", label: "Эфир", icon: "▣" },
  { id: "onboarding", label: "Старт", icon: "+" },
] as const;

type ScreenId = (typeof screens)[number]["id"];

const avatarGradients = [
  "from-[#ff78ad] to-[#ffc479]",
  "from-[#8e6cff] to-[#e968df]",
  "from-[#4bc7c2] to-[#78a5ff]",
  "from-[#ff9c65] to-[#e65a99]",
];

function DemoAvatar({
  name,
  index,
  size = "size-12",
}: {
  name: string;
  index: number;
  size?: string;
}) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-full bg-gradient-to-br p-0.5 ${avatarGradients[index % avatarGradients.length]}`}
    >
      <span className="grid size-full place-items-center rounded-full bg-white text-sm font-black text-[#2d2138] shadow-[0_4px_12px_rgba(65,42,86,0.12)]">
        {name.slice(0, 1)}
      </span>
    </span>
  );
}

function DemoBottomNav({ active = "Главная" }: { active?: string }) {
  const items = [
    { label: "Главная", icon: Search },
    { label: "Поиск", icon: Search },
    { label: "Активность", icon: Bell },
    { label: "Профиль", icon: UserRound },
  ];
  return (
    <nav
      className="mt-7 flex items-end justify-around border-t border-[#2c2036]/10 bg-white px-2 pb-2 pt-2 text-[#7c7084]"
      aria-label="Демо навигация"
    >
      {items.slice(0, 2).map(({ label, icon: Icon }) => (
        <span
          className={`grid place-items-center gap-0.5 text-[10px] ${active === label ? "font-black text-[#7549d0]" : ""}`}
          key={label}
        >
          <Icon className="size-4" />
          {label}
        </span>
      ))}
      <span className="-mt-5 grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#ff4d8d] to-[#8753ed] text-white shadow-[0_8px_22px_rgba(174,74,201,0.3)]">
        <CirclePlus className="size-6" />
      </span>
      {items.slice(2).map(({ label, icon: Icon }) => (
        <span
          className={`grid place-items-center gap-0.5 text-[10px] ${active === label ? "font-black text-[#7549d0]" : ""}`}
          key={label}
        >
          <Icon className="size-4" />
          {label}
        </span>
      ))}
    </nav>
  );
}

function PreviewFeed() {
  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-5">
        <span className="flex items-center gap-2 text-lg font-black tracking-[-0.055em]">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#ff4d8d] to-[#8753ed] text-white">
            ♡
          </span>
          Хочу также
        </span>
        <span className="grid size-8 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#715f80]">
          <Search className="size-4" />
        </span>
      </header>
      <div className="mx-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#f0e9f5] p-1 text-center text-[10px] font-bold">
        <span className="rounded-xl bg-white px-1 py-2 text-[#7549d0] shadow-sm">
          Для тебя
        </span>
        <span className="px-1 py-2 text-[#7e7187]">В эфире</span>
        <span className="px-1 py-2 text-[#7e7187]">Популярное</span>
      </div>
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-black">Сейчас в эфире</h1>
          <span className="text-[10px] font-bold text-[#8753e6]">Смотреть все ›</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {["Настя", "Макс", "Алина"].map((name, index) => (
            <div
              className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#d44d8e] via-[#a661d9] to-[#5e52ba] p-2 text-white shadow-[0_8px_20px_rgba(77,43,111,0.18)]"
              key={name}
            >
              <span className="rounded-md bg-[#ff315c] px-1.5 py-0.5 text-[8px] font-black">
                LIVE
              </span>
              <span className="absolute inset-x-2 bottom-2">
                <b className="block text-xs">{name}</b>
                <small className="block text-[8px] text-white/80">
                  ● {index === 0 ? "2,4K" : "1,2K"}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black">Популярные авторы</h2>
          <span className="text-[10px] font-bold text-[#8753e6]">Все ›</span>
        </div>
        <div className="flex justify-between">
          {["Настя", "Дима", "Ксюша", "Влад"].map((name, index) => (
            <span className="flex w-16 flex-col items-center gap-1.5" key={name}>
              <DemoAvatar index={index} name={name} />
              <b className="w-full truncate text-center text-[10px]">{name}</b>
              <small className="text-[9px] text-[#83758b]">
                {["124K", "87K", "64K", "52K"][index]}
              </small>
            </span>
          ))}
        </div>
      </section>
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black">Новые авторы</h2>
          <span className="text-[10px] font-bold text-[#8753e6]">Все ›</span>
        </div>
        {["Саша", "Лера"].map((name, index) => (
          <div
            className="mb-2 flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-2.5 shadow-[0_6px_18px_rgba(68,42,90,0.05)]"
            key={name}
          >
            <DemoAvatar index={index + 2} name={name} size="size-10" />
            <span className="min-w-0 grow">
              <b className="block text-xs">{name}</b>
              <small className="block truncate text-[10px] text-[#81748a]">
                Только пришёл(а) в город
              </small>
            </span>
            <span className="rounded-xl bg-gradient-to-r from-[#ff6b9f] to-[#8753ed] px-2.5 py-1.5 text-[10px] font-black text-white">
              Подписаться
            </span>
          </div>
        ))}
      </section>
      <DemoBottomNav />
    </>
  );
}

function PreviewProfile() {
  return (
    <>
      <section className="relative h-44 overflow-hidden bg-gradient-to-br from-[#f8a0bc] via-[#a66be1] to-[#595bc4]">
        <span className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-white/30 text-white">
          ‹
        </span>
        <span className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/30 text-white">
          •••
        </span>
      </section>
      <section className="relative px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between">
          <DemoAvatar index={0} name="Настя" size="size-20" />
          <span className="rounded-xl bg-gradient-to-r from-[#ff6e9f] to-[#8753ed] px-4 py-2 text-xs font-black text-white">
            Подписаться
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <h1 className="text-2xl font-black tracking-[-0.055em]">Настя</h1>
          <span className="text-sm text-[#8753ed]">●</span>
          <span className="rounded-full bg-[#f0e6ff] px-2 py-1 text-[9px] font-black text-[#7549d0]">
            Автор
          </span>
        </div>
        <p className="mt-1 text-xs text-[#81748a]">23 года · Будённовск</p>
        <div className="mt-4 grid grid-cols-3 text-center">
          {["12,4K", "320", "1,2M"].map((value, index) => (
            <span key={value}>
              <b className="block text-base">{value}</b>
              <small className="text-[9px] text-[#84778d]">
                {["Подписчики", "Подписки", "Охват"][index]}
              </small>
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-[#61546b]">
          Тут мы создаём классную атмосферу: музыка, эфиры и путешествия.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Написать", "Поговорить", "Совместный стрим"].map((label, index) => (
            <span
              className="rounded-xl border border-[#2c2036]/10 bg-white p-2 text-center shadow-[0_5px_14px_rgba(68,42,90,0.05)]"
              key={label}
            >
              <MessageCircle className="mx-auto size-4 text-[#8753e6]" />
              <small className="mt-1 block text-[8px] font-bold">{label}</small>
              <small className="block text-[8px] text-[#9a8fa1]">
                {["49 ₽", "15 мин", "799 ₽"][index]}
              </small>
            </span>
          ))}
        </div>
        <span className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#f4edff] py-2 text-xs font-black text-[#7549d0]">
          <Gift className="size-4" /> Отправить подарок
        </span>
      </section>
      <div className="grid grid-cols-3 border-y border-[#2c2036]/10 text-center text-[10px] font-bold">
        <span className="border-b-2 border-[#ef5793] py-3 text-[#7549d0]">Эфиры</span>
        <span className="py-3 text-[#877b90]">Посты</span>
        <span className="py-3 text-[#877b90]">Обо мне</span>
      </div>
      <DemoBottomNav active="Профиль" />
    </>
  );
}

function PreviewEarnings() {
  const rows = [
    ["Донаты", "58 450 ₽", "✦"],
    ["Платные сообщения", "19 400 ₽", "◌"],
    ["Платное общение", "24 600 ₽", "♡"],
    ["Подписки", "17 600 ₽", "♛"],
  ];
  return (
    <>
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <span>‹</span>
        <h1 className="text-sm font-black">Мой заработок</h1>
        <span>⚙</span>
      </header>
      <section className="mx-4 rounded-[1.7rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_12px_30px_rgba(68,42,90,0.07)]">
        <div className="flex items-start justify-between">
          <span>
            <small className="text-[#81748a]">Баланс</small>
            <b className="mt-1 block text-3xl tracking-[-0.06em]">24 560 ₽</b>
          </span>
          <span className="rounded-xl bg-gradient-to-r from-[#ff6c9f] to-[#8753ed] px-3 py-2 text-xs font-black text-white">
            Вывести
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between rounded-2xl bg-[#f6effb] p-3">
          <span>
            <small className="text-[#81748a]">Доход за месяц</small>
            <b className="mt-1 block text-xl">128 450 ₽</b>
          </span>
          <span className="text-xs font-black text-[#219768]">+23% ↗</span>
        </div>
      </section>
      <section className="px-4 pt-6">
        <h2 className="text-sm font-black">Источники дохода</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#2c2036]/10 bg-white">
          {rows.map(([name, value, icon]) => (
            <div
              className="border-[#2c2036]/8 flex items-center justify-between border-b px-4 py-3 last:border-0"
              key={name}
            >
              <span className="flex items-center gap-2.5 text-xs font-bold">
                <span className="grid size-7 place-items-center rounded-lg bg-[#f2e7ff] text-[#8753e6]">
                  {icon}
                </span>
                {name}
              </span>
              <b className="text-xs">{value}</b>
            </div>
          ))}
        </div>
      </section>
      <DemoBottomNav />
    </>
  );
}

function PreviewBonuses() {
  return (
    <>
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <span>‹</span>
        <h1 className="text-sm font-black">Приглашай друзей</h1>
        <span className="w-4" />
      </header>
      <section className="mx-4 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#f9edff] via-[#fff7fb] to-[#eaf5ff] p-5 text-center shadow-[0_14px_34px_rgba(84,49,112,0.1)]">
        <p className="text-sm font-black text-[#6944a5]">
          Пригласи активного пользователя
          <br />в Будённовск — получи
        </p>
        <p className="mt-2 text-5xl font-black tracking-[-0.08em] text-[#d64595]">
          200 ⭐
        </p>
        <span className="mt-3 inline-flex rounded-full bg-[#fff0b9] px-3 py-1 text-[10px] font-black text-[#846114]">
          за активное приглашение
        </span>
      </section>
      <section className="mx-4 mt-5 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8753e6]">
          Твоя ссылка
        </p>
        <p className="mt-2 truncate rounded-xl bg-[#f7f2fa] p-2.5 text-[10px] text-[#74687d]">
          hochutakzhe.ru/r/first-wave?city=budennovsk
        </p>
        <span className="mt-3 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8753ed] py-2.5 text-xs font-black text-white">
          Пригласить друзей
        </span>
      </section>
      <section className="px-4 pt-6">
        <h2 className="text-sm font-black">Кто по твоей ссылке</h2>
        {["Алина", "Максим", "Кирилл"].map((name, index) => (
          <div
            className="mt-2 flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-3"
            key={name}
          >
            <DemoAvatar index={index} name={name} size="size-10" />
            <span className="grow">
              <b className="block text-xs">{name}</b>
              <small className="text-[10px] text-[#81748a]">
                {index === 0 ? "Профиль заполнен" : "Стал активной"}
              </small>
            </span>
            <b className="text-xs text-[#9b59e9]">+200 ⭐</b>
          </div>
        ))}
      </section>
      <DemoBottomNav />
    </>
  );
}

function PreviewMessages() {
  return (
    <>
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <span>
          <small className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#8b5fbd]">
            Общение
          </small>
          <h1 className="text-2xl font-black tracking-[-0.06em]">Сообщения</h1>
        </span>
        <Pen />
      </header>
      <div className="mx-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#f0e9f5] p-1 text-center text-[10px] font-black">
        <span className="rounded-xl bg-white py-2 text-[#7549d0]">Все</span>
        <span className="py-2 text-[#877b90]">Непрочитанные</span>
        <span className="py-2 text-[#877b90]">Платные</span>
      </div>
      <section className="px-4 pt-5">
        {["Настя", "Алина", "Макс", "Дима"].map((name, index) => (
          <div
            className="mb-2 flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-3 shadow-[0_6px_16px_rgba(68,42,90,0.05)]"
            key={name}
          >
            <DemoAvatar index={index} name={name} />
            <span className="grow">
              <b className="block text-xs">{name}</b>
              <small className="block text-[10px] text-[#81748a]">
                Привет! Спасибо за поддержку 💗
              </small>
            </span>
            {index < 2 && (
              <span className="grid size-5 place-items-center rounded-full bg-gradient-to-r from-[#ff5d9a] to-[#8753ed] text-[9px] font-black text-white">
                {index + 1}
              </span>
            )}
          </div>
        ))}
      </section>
      <DemoBottomNav active="Активность" />
    </>
  );
}

function Pen() {
  return (
    <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8753e6]">
      <Send className="size-4" />
    </span>
  );
}

function PreviewLive() {
  return (
    <>
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <span>×</span>
        <h1 className="text-sm font-black">Создание эфира</h1>
        <span className="w-4" />
      </header>
      <section className="mx-4 mt-4 rounded-[1.8rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_12px_30px_rgba(68,42,90,0.08)]">
        <span className="mx-auto grid size-16 place-items-center rounded-[1.5rem] bg-[#f0e4ff] text-[#8753e6]">
          <VideoIcon />
        </span>
        <p className="mt-4 text-center text-xs font-black text-[#8753e6]">LIVE ROOM</p>
        <h1 className="mt-1 text-center text-2xl font-black">Выйди в эфир</h1>
        <Field label="Название эфира" value="Например: Болтаем и играем 💜" />
        <Field label="Кто может смотреть" value="Все ›" />
        <div className="mt-3 flex items-center justify-between text-xs font-bold">
          <span>Разрешить чат</span>
          <span className="h-5 w-9 rounded-full bg-[#8753ed] p-0.5">
            <span className="block size-4 translate-x-4 rounded-full bg-white" />
          </span>
        </div>
        <span className="mt-5 flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8753ed] py-3 text-sm font-black text-white">
          Начать эфир
        </span>
      </section>
    </>
  );
}

function VideoIcon() {
  return <Video className="size-7" />;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="mt-4 block">
      <b className="text-xs">{label}</b>
      <span className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-[#2c2036]/10 bg-[#faf7fc] px-3 text-[10px] text-[#9a8fa1]">
        {value}
      </span>
    </label>
  );
}

function PreviewOnboarding() {
  return (
    <section className="min-h-[680px] p-5">
      <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff5d9a] to-[#8753ed] text-xl text-white">
        ♡
      </span>
      <h1 className="mt-7 text-3xl font-black leading-[0.92] tracking-[-0.07em]">
        Добро пожаловать
        <br />в Хочу также!
      </h1>
      <p className="mt-4 max-w-xs text-sm leading-6 text-[#74677d]">
        Ты можешь не только смотреть, но и зарабатывать здесь.
      </p>
      <div className="mt-8 space-y-4">
        {[
          "Создай профиль",
          "Расскажи о себе",
          "Начни эфир или общайся",
          "Получай поддержку и донаты",
        ].map((item, index) => (
          <span className="flex items-center gap-3 text-sm font-bold" key={item}>
            <span className="grid size-7 place-items-center rounded-lg bg-[#f0e4ff] text-xs text-[#8753e6]">
              {index + 1}
            </span>
            {item}
          </span>
        ))}
      </div>
      <span className="mt-10 flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8753ed] py-3.5 text-sm font-black text-white">
        Создать профиль
      </span>
      <span className="mt-3 block text-center text-xs font-bold text-[#8753e6]">
        Сделаю позже
      </span>
    </section>
  );
}

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const { screen: rawScreen } = await searchParams;
  const screen = screens.some((item) => item.id === rawScreen)
    ? (rawScreen as ScreenId)
    : "feed";
  const content: Record<ScreenId, React.ReactNode> = {
    feed: <PreviewFeed />,
    profile: <PreviewProfile />,
    earnings: <PreviewEarnings />,
    bonuses: <PreviewBonuses />,
    messages: <PreviewMessages />,
    live: <PreviewLive />,
    onboarding: <PreviewOnboarding />,
  };

  return (
    <main className="min-h-screen bg-[#ede8f2] px-4 py-5 text-[#241a2c] sm:px-8 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[240px_minmax(0,430px)_1fr] lg:items-start">
        <aside className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(68,42,90,0.1)] backdrop-blur lg:sticky lg:top-8">
          <Link
            className="flex items-center gap-2 text-lg font-black tracking-[-0.06em]"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff4d8d] to-[#8753ed] text-white">
              ♡
            </span>
            Хочу также
          </Link>
          <p className="mt-5 text-xs leading-5 text-[#776b80]">
            Preview флагманского кабинета. Все имена, суммы и статусы на этом экране —
            синтетическая демонстрация UI.
          </p>
          <nav
            className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1"
            aria-label="Экраны preview"
          >
            {screens.map((item) => (
              <a
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${screen === item.id ? "bg-[#f0e5ff] text-[#7549d0]" : "text-[#6e6277] hover:bg-[#f7f2fa]"}`}
                href={`/preview?screen=${item.id}`}
                key={item.id}
              >
                <span className="grid size-6 place-items-center rounded-lg bg-white text-xs shadow-sm">
                  {item.icon}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <section className="overflow-hidden rounded-[2.2rem] border border-white/90 bg-[#f7f4fb] shadow-[0_26px_80px_rgba(58,34,82,0.2)]">
          <div className="border-[#2c2036]/8 flex items-center justify-between border-b bg-white/70 px-5 py-2 text-[10px] font-bold text-[#82758b]">
            <span>ДЕМО UI · БЕЗ АВТОРИЗАЦИИ</span>
            <span>{screens.find((item) => item.id === screen)?.label}</span>
          </div>
          {content[screen]}
        </section>
        <section className="hidden rounded-[2rem] border border-white/80 bg-white/60 p-7 shadow-[0_12px_35px_rgba(68,42,90,0.07)] lg:block">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#8b5fbd]">
            Без доступа к аккаунту
          </p>
          <h1 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.065em]">
            Смотри дизайн. Не трогай данные.
          </h1>
          <p className="mt-5 text-sm leading-6 text-[#74677d]">
            Эта витрина существует только для просмотра нового visual-направления.
            Реальные кабинеты, сообщения, доход и городские данные по-прежнему защищены
            авторизацией и RLS.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#8753e6]"
            href="/"
          >
            На публичную главную <ChevronRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
