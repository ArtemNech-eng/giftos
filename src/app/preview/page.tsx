import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  CirclePlus,
  Compass,
  MessageCircle,
  Play,
  Radio,
  Search,
  Send,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

export const metadata = {
  title: "Preview кабинета",
  robots: { index: false, follow: false },
};

const screens = [
  { id: "feed", label: "Главная", number: "01" },
  { id: "profile", label: "Профиль", number: "02" },
  { id: "earnings", label: "Доход", number: "03" },
  { id: "bonuses", label: "Рефералы", number: "04" },
  { id: "messages", label: "Сообщения", number: "05" },
  { id: "live", label: "Эфир", number: "06" },
  { id: "onboarding", label: "Старт", number: "07" },
] as const;

type ScreenId = (typeof screens)[number]["id"];

const people = [
  { name: "Настя", tone: "bg-[#f87d9c]" },
  { name: "Дима", tone: "bg-[#784ee9]" },
  { name: "Ксюша", tone: "bg-[#2eaaa5]" },
  { name: "Влад", tone: "bg-[#e38c45]" },
];

function Mark() {
  return (
    <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-[#17151a] text-lg font-black text-[#f5f0e8]">
      Х
      <span className="absolute -bottom-2 -right-1 size-5 rounded-full bg-[#fb407b]" />
    </span>
  );
}

function Avatar({
  name,
  index,
  size = "size-12",
}: {
  name: string;
  index: number;
  size?: string;
}) {
  const person = people[index % people.length];
  return (
    <span
      className={`relative grid ${size} shrink-0 place-items-center rounded-full ${person.tone} p-[2px]`}
    >
      <span className="grid size-full place-items-center rounded-full bg-[#f5f0e8] text-xs font-black text-[#17151a]">
        {name.slice(0, 1)}
      </span>
      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#f5f0e8] bg-[#41ad7e]" />
    </span>
  );
}

function Rule() {
  return <div className="bg-[#17151a]/12 h-px" />;
}

function AppNav({ active }: { active: string }) {
  const entries = [
    { label: "Главная", icon: Compass },
    { label: "Поиск", icon: Search },
    { label: "Чаты", icon: MessageCircle },
    { label: "Я", icon: UserRound },
  ];
  return (
    <nav className="border-[#17151a]/12 mt-auto flex h-[70px] items-end justify-around border-t bg-[#f5f0e8] px-2 pb-2 pt-2">
      {entries.slice(0, 2).map(({ label, icon: Icon }) => (
        <span
          className={`grid place-items-center gap-1 text-[9px] font-bold ${active === label ? "text-[#17151a]" : "text-[#8d8784]"}`}
          key={label}
        >
          <Icon className="size-4" strokeWidth={active === label ? 2.6 : 1.8} />
          {label}
        </span>
      ))}
      <span className="-mt-6 grid size-12 place-items-center rounded-full bg-[#17151a] text-[#f5f0e8] shadow-[0_8px_0_#fb407b]">
        <CirclePlus className="size-6" />
      </span>
      {entries.slice(2).map(({ label, icon: Icon }) => (
        <span
          className={`grid place-items-center gap-1 text-[9px] font-bold ${active === label ? "text-[#17151a]" : "text-[#8d8784]"}`}
          key={label}
        >
          <Icon className="size-4" strokeWidth={active === label ? 2.6 : 1.8} />
          {label}
        </span>
      ))}
    </nav>
  );
}

function FeedScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#f5f0e8]">
      <header className="flex items-center justify-between px-5 pb-5 pt-5">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[17px] font-black tracking-[-0.08em]">ХОЧУ ТАКЖЕ</span>
        </div>
        <span className="grid size-9 place-items-center rounded-full border border-[#17151a]/15 bg-[#fbf8f1]">
          <Search className="size-4" />
        </span>
      </header>
      <div className="px-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[9px] font-bold tracking-[0.16em] text-[#77706e]">
              БУДЁННОВСК / 01
            </p>
            <h1 className="mt-1 text-[32px] font-black leading-[0.84] tracking-[-0.09em]">
              ЛЮДИ
              <br />
              СЕЙЧАС.
            </h1>
          </div>
          <span className="mb-1 max-w-24 text-right text-[10px] leading-4 text-[#6b6462]">
            Не лента ради ленты. Повод встретиться.
          </span>
        </div>
        <div className="mt-5">
          <Rule />
        </div>
      </div>
      <section className="px-5 py-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-black tracking-[-0.02em]">В ГОРОДЕ</p>
          <span className="font-mono text-[9px] font-bold text-[#fb407b]">
            СМОТРЕТЬ ВСЕХ →
          </span>
        </div>
        <div className="flex justify-between gap-2">
          {people.map((person, index) => (
            <span className="flex w-14 flex-col items-center gap-1.5" key={person.name}>
              <Avatar index={index} name={person.name} />
              <b className="w-full truncate text-center text-[10px]">{person.name}</b>
            </span>
          ))}
          <span className="grid size-12 place-items-center self-start rounded-full border border-dashed border-[#17151a]/30 text-sm font-black text-[#77706e]">
            +?
          </span>
        </div>
      </section>
      <section className="mx-5 overflow-hidden rounded-[18px] bg-[#17151a] text-[#f5f0e8] shadow-[0_12px_0_#fb407b]">
        <div className="flex min-h-40 flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <span className="rounded bg-[#fb407b] px-2 py-1 font-mono text-[9px] font-black tracking-[0.12em]">
              LIVE / 21:04
            </span>
            <span className="font-mono text-[9px] text-white/55">В ЭФИРЕ</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#ff9bbd]">НАСТЯ / МУЗЫКА</p>
              <h2 className="mt-1 text-3xl font-black leading-[0.85] tracking-[-0.08em]">
                СОБИРАЕМ
                <br />
                СВОИХ.
              </h2>
            </div>
            <span className="grid size-11 place-items-center rounded-full border border-white/20">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          </div>
        </div>
      </section>
      <section className="px-5 pb-6 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-black">НОВЫЕ ЛИЦА</p>
          <span className="font-mono text-[9px] font-bold text-[#fb407b]">ЗАЙТИ →</span>
        </div>
        <div className="border-[#17151a]/12 border-y">
          {["Саша — пришёл сегодня", "Лера — хочет собрать свою тусовку"].map(
            (label, index) => (
              <div
                className="border-[#17151a]/12 flex items-center gap-3 border-b py-3 last:border-0"
                key={label}
              >
                <span
                  className={`grid size-9 place-items-center rounded-full text-xs font-black text-white ${people[index + 2].tone}`}
                >
                  {label[0]}
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-xs">{label.split(" — ")[0]}</b>
                  <small className="block truncate text-[10px] text-[#756d69]">
                    {label.split(" — ")[1]}
                  </small>
                </span>
                <ArrowUpRight className="size-4" />
              </div>
            ),
          )}
        </div>
      </section>
      <AppNav active="Главная" />
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#f5f0e8]">
      <section className="relative h-48 overflow-hidden bg-[#2e2550]">
        <div className="absolute -right-8 -top-10 size-52 rounded-full border-[28px] border-[#fb407b]" />
        <div className="absolute bottom-0 left-0 h-20 w-full bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_10px,rgba(255,255,255,.08)_10px,rgba(255,255,255,.08)_11px)]" />
        <span className="absolute left-4 top-4 grid size-9 place-items-center rounded-full border border-white/20 bg-black/10 text-white">
          ‹
        </span>
        <span className="absolute right-4 top-4 font-mono text-[9px] font-bold tracking-[0.16em] text-white/70">
          PROFILE / 014
        </span>
      </section>
      <section className="relative px-5 pb-5">
        <div className="-mt-10 flex items-end justify-between">
          <Avatar index={0} name="Настя" size="size-20" />
          <button className="rounded-[10px] bg-[#17151a] px-4 py-2.5 text-xs font-black text-[#f5f0e8] shadow-[0_4px_0_#fb407b]">
            ПОДПИСАТЬСЯ
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <h1 className="text-3xl font-black tracking-[-0.08em]">НАСТЯ</h1>
          <span className="size-2 rounded-full bg-[#8753ed]" />
          <span className="font-mono text-[9px] text-[#756d69]">23 / БУДЁННОВСК</span>
        </div>
        <p className="mt-3 max-w-sm text-xs leading-5 text-[#5e5755]">
          Собираю музыку, людей и маленькие причины не сидеть дома.
        </p>
        <div className="border-[#17151a]/12 mt-5 grid grid-cols-3 border-y py-3 text-center">
          {["12,4K", "320", "1,2M"].map((number, index) => (
            <span key={number}>
              <b className="block text-base tracking-[-0.06em]">{number}</b>
              <small className="font-mono text-[8px] text-[#7b7471]">
                {["ЛЮДИ", "СВЯЗИ", "ОХВАТ"][index]}
              </small>
            </span>
          ))}
        </div>
        <p className="mt-5 font-mono text-[9px] font-bold tracking-[0.15em] text-[#fb407b]">
          МОЖНО СО МНОЙ
        </p>
        <div className="mt-2 grid grid-cols-3 gap-px bg-[#17151a]/15">
          {["НАПИСАТЬ / 49", "ГОВОРИТЬ / 15М", "СО-ЭФИР / 799"].map((item) => (
            <span
              className="bg-[#f5f0e8] p-2 text-center text-[9px] font-black"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </section>
      <div className="border-[#17151a]/12 mt-auto grid grid-cols-3 border-t text-center font-mono text-[9px] font-bold">
        <span className="border-b-2 border-[#fb407b] py-3">ЭФИРЫ</span>
        <span className="py-3 text-[#817976]">ПОСТЫ</span>
        <span className="py-3 text-[#817976]">ОБО МНЕ</span>
      </div>
      <AppNav active="Я" />
    </div>
  );
}

function EarningsScreen() {
  const income = [
    ["ДОНАТЫ", "58 450", "#fb407b"],
    ["СООБЩЕНИЯ", "19 400", "#8753ed"],
    ["ПОДПИСКИ", "17 600", "#2eaaa5"],
    ["ЭФИРЫ", "8 000", "#e38c45"],
  ];
  return (
    <div className="min-h-[730px] bg-[#f5f0e8] p-5">
      <header className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-full border border-[#17151a]/15">
          ‹
        </span>
        <span className="font-mono text-[10px] font-black tracking-[0.14em]">
          МОЙ ДОХОД
        </span>
        <span className="grid size-9 place-items-center rounded-full border border-[#17151a]/15">
          <WalletCards className="size-4" />
        </span>
      </header>
      <p className="mt-9 font-mono text-[9px] font-bold tracking-[0.16em] text-[#fb407b]">
        ТЕСТОВЫЙ БАЛАНС / НЕ ВЫВОДИТСЯ
      </p>
      <p className="mt-2 text-5xl font-black tracking-[-0.1em]">24 560 ₽</p>
      <div className="mt-5 flex items-end gap-2">
        <span className="text-2xl font-black tracking-[-0.06em]">+23%</span>
        <span className="mb-1 text-xs text-[#756d69]">к прошлому периоду</span>
        <span className="ml-auto h-10 w-28 bg-[linear-gradient(135deg,transparent_20%,#8753ed_20%,#8753ed_27%,transparent_27%,transparent_45%,#fb407b_45%,#fb407b_52%,transparent_52%,transparent_70%,#2eaaa5_70%,#2eaaa5_78%,transparent_78%)]" />
      </div>
      <div className="mt-6">
        <Rule />
      </div>
      <section className="pt-5">
        <div className="flex items-end justify-between">
          <h1 className="text-[26px] font-black tracking-[-0.07em]">
            ИЗ ЧЕГО
            <br />
            СОБРАЛОСЬ
          </h1>
          <span className="font-mono text-[9px] text-[#756d69]">ВСЁ ВРЕМЯ</span>
        </div>
        <div className="mt-5 space-y-3">
          {income.map(([label, value, color], index) => (
            <div className="flex items-center gap-3" key={label}>
              <span className="grid size-7 place-items-center rounded-full bg-[#17151a] text-[9px] font-black text-white">
                0{index + 1}
              </span>
              <span className="border-[#17151a]/12 grow border-b pb-2 text-xs font-black">
                {label}
              </span>
              <b className="pb-2 text-xs">{value} ₽</b>
              <span
                className="mb-2 size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8 rounded-[16px] bg-[#17151a] p-4 text-[#f5f0e8]">
        <p className="font-mono text-[9px] tracking-[0.15em] text-[#fb9fbd]">ВАЖНО</p>
        <p className="mt-2 text-xs leading-5 text-white/70">
          Реальные выплаты появятся только после KYC и подключения платёжного партнёра.
        </p>
      </div>
      <AppNav active="Я" />
    </div>
  );
}

function BonusesScreen() {
  return (
    <div className="min-h-[730px] bg-[#f5f0e8] p-5">
      <header className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-full border border-[#17151a]/15">
          ‹
        </span>
        <span className="font-mono text-[10px] font-black tracking-[0.14em]">
          ПРИГЛАШЕНИЕ
        </span>
        <span className="w-9" />
      </header>
      <section className="mt-8 overflow-hidden rounded-[18px] border-2 border-[#17151a] bg-[#fb407b] p-5 text-[#17151a] shadow-[7px_7px_0_#8753ed]">
        <p className="font-mono text-[9px] font-black tracking-[0.16em]">
          БУДЁННОВСК / ПЕРВАЯ ВОЛНА
        </p>
        <h1 className="mt-5 text-5xl font-black leading-[0.76] tracking-[-0.12em]">
          +200
          <br />⭐
        </h1>
        <p className="mt-5 max-w-48 text-xs font-bold leading-5">
          За активного человека, которого ты привёл в город.
        </p>
        <div className="mt-5 border-t border-[#17151a]/30 pt-3 font-mono text-[9px] font-bold">
          РЕГИСТРАЦИЯ → ПРОФИЛЬ → ПЕРВОЕ ДЕЙСТВИЕ
        </div>
      </section>
      <section className="mt-9">
        <p className="font-mono text-[9px] font-black tracking-[0.15em] text-[#756d69]">
          ТВОЯ ССЫЛКА
        </p>
        <div className="mt-2 border-b-2 border-[#17151a] pb-3 text-xs font-bold">
          hochutakzhe.ru/r/first-wave
        </div>
        <button className="mt-4 flex w-full items-center justify-between bg-[#17151a] px-4 py-3 text-xs font-black text-[#f5f0e8]">
          СКОПИРОВАТЬ ПРИГЛАШЕНИЕ <Send className="size-4" />
        </button>
      </section>
      <section className="mt-9">
        <div className="flex justify-between">
          <h2 className="text-lg font-black tracking-[-0.06em]">КРУГ ГОРОДА</h2>
          <span className="font-mono text-[9px] text-[#fb407b]">+200 ЗА КАЖДОГО</span>
        </div>
        <div className="border-[#17151a]/12 mt-3 border-y">
          {["Алина / профиль", "Максим / первое действие", "Кирилл / бонус готов"].map(
            (item, index) => (
              <div
                className="border-[#17151a]/12 flex items-center gap-3 border-b py-3 last:border-0"
                key={item}
              >
                <Avatar index={index} name={item} size="size-9" />
                <span className="grow text-xs font-bold">{item}</span>
                <span className="text-[10px] font-black text-[#8753ed]">+200</span>
              </div>
            ),
          )}
        </div>
      </section>
      <AppNav active="Я" />
    </div>
  );
}

function MessagesScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#f5f0e8]">
      <header className="flex items-end justify-between px-5 pb-5 pt-5">
        <div>
          <p className="font-mono text-[9px] font-black tracking-[0.15em] text-[#fb407b]">
            ЛИЧНОЕ
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-[-0.1em]">ЧАТЫ</h1>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-[#17151a] text-white">
          <Send className="size-4" />
        </span>
      </header>
      <div className="border-[#17151a]/12 mx-5 flex gap-5 border-y py-3 font-mono text-[9px] font-bold">
        <span className="text-[#17151a]">ВСЕ / 04</span>
        <span className="text-[#817976]">НЕПРОЧИТАННЫЕ / 02</span>
      </div>
      <section className="px-5">
        {["Настя", "Алина", "Макс", "Дима"].map((name, index) => (
          <div
            className="border-[#17151a]/12 flex items-center gap-3 border-b py-4"
            key={name}
          >
            <Avatar index={index} name={name} />
            <span className="min-w-0 grow">
              <b className="block text-sm">{name}</b>
              <small className="block truncate text-[10px] text-[#756d69]">
                Спасибо за поддержку. Пойдём в эфир?
              </small>
            </span>
            {index < 2 ? (
              <span className="grid size-5 place-items-center rounded-full bg-[#fb407b] text-[9px] font-black">
                {index + 1}
              </span>
            ) : (
              <ChevronRight className="size-4" />
            )}
          </div>
        ))}
      </section>
      <div className="mt-auto px-5 pb-6">
        <p className="text-center text-[10px] leading-5 text-[#7c7472]">
          Диалог открывается только после принятого запроса. Здесь нельзя купить чужое
          согласие.
        </p>
      </div>
      <AppNav active="Чаты" />
    </div>
  );
}

function LiveScreen() {
  return (
    <div className="min-h-[730px] bg-[#f5f0e8] p-5">
      <header className="flex items-center justify-between">
        <X className="size-5" />
        <span className="font-mono text-[10px] font-black tracking-[0.14em]">
          НОВЫЙ ЭФИР
        </span>
        <span className="w-5" />
      </header>
      <section className="mt-8 bg-[#17151a] p-5 text-[#f5f0e8] shadow-[7px_7px_0_#fb407b]">
        <Radio className="size-8 text-[#fb407b]" />
        <h1 className="mt-12 text-4xl font-black leading-[0.82] tracking-[-0.1em]">
          НАЖМИ
          <br />
          «НАЧАТЬ».
        </h1>
        <p className="mt-4 max-w-52 text-xs leading-5 text-white/65">
          Комната, ссылка и чат — чтобы собрать своих без лишней техники.
        </p>
      </section>
      <section className="mt-8 space-y-5">
        <Field label="НАЗВАНИЕ" value="Болтаем и играем" />
        <Field label="КТО МОЖЕТ СМОТРЕТЬ" value="Все / ›" />
        <div className="border-[#17151a]/12 flex justify-between border-y py-4 text-xs font-bold">
          <span>РАЗРЕШИТЬ ЧАТ</span>
          <span className="rounded-full bg-[#17151a] px-2 py-0.5 text-[9px] text-white">
            ВКЛ
          </span>
        </div>
        <button className="flex w-full items-center justify-between bg-[#fb407b] px-4 py-4 text-sm font-black text-[#17151a]">
          НАЧАТЬ ЭФИР <ArrowUpRight className="size-5" />
        </button>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] font-black tracking-[0.14em] text-[#756d69]">
        {label}
      </span>
      <span className="mt-2 flex h-12 items-center border-b-2 border-[#17151a] text-sm font-bold">
        {value}
      </span>
    </label>
  );
}

function OnboardingScreen() {
  return (
    <div className="min-h-[730px] bg-[#17151a] p-6 text-[#f5f0e8]">
      <Mark />
      <p className="mt-16 font-mono text-[10px] font-bold tracking-[0.17em] text-[#fb9fbd]">
        ПЕРВЫЙ ШАГ / 01
      </p>
      <h1 className="mt-4 text-5xl font-black leading-[0.8] tracking-[-0.12em]">
        НЕ СМОТРИ.
        <br />
        УЧАСТВУЙ.
      </h1>
      <p className="mt-7 max-w-56 text-sm leading-6 text-white/65">
        Создай профиль, скажи, что тебе важно, и найди людей, которым это тоже не всё
        равно.
      </p>
      <div className="mt-10 border-t border-white/15 pt-5">
        {["Профиль", "Интересы", "Город", "Первое желание"].map((item, index) => (
          <div className="flex items-center gap-3 py-2" key={item}>
            <span className="font-mono text-[10px] text-[#fb407b]">0{index + 1}</span>
            <span className="text-xs font-bold">{item}</span>
          </div>
        ))}
      </div>
      <button className="mt-10 flex w-full items-center justify-between bg-[#f5f0e8] px-4 py-4 text-sm font-black text-[#17151a]">
        СОЗДАТЬ ПРОФИЛЬ <ArrowUpRight className="size-5" />
      </button>
    </div>
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
    feed: <FeedScreen />,
    profile: <ProfileScreen />,
    earnings: <EarningsScreen />,
    bonuses: <BonusesScreen />,
    messages: <MessagesScreen />,
    live: <LiveScreen />,
    onboarding: <OnboardingScreen />,
  };

  return (
    <main className="min-h-screen bg-[#dcd7d1] px-4 py-5 text-[#17151a] sm:px-8 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[230px_430px_minmax(0,1fr)] lg:items-start">
        <aside className="border border-[#17151a]/15 bg-[#f5f0e8] p-5 shadow-[8px_8px_0_#17151a] lg:sticky lg:top-8">
          <Link
            className="flex items-center gap-2.5 text-lg font-black tracking-[-0.08em]"
            href="/"
          >
            <Mark />
            ХОЧУ ТАКЖЕ
          </Link>
          <p className="border-[#17151a]/12 mt-6 border-t pt-4 font-mono text-[9px] leading-5 text-[#716a67]">
            ДИЗАЙН-ПРОСМОТР / СИНТЕТИЧЕСКИЕ ДАННЫЕ / БЕЗ ДОСТУПА К РЕАЛЬНЫМ АККАУНТАМ
          </p>
          <nav
            className="bg-[#17151a]/12 mt-5 grid grid-cols-2 gap-px lg:grid-cols-1"
            aria-label="Экраны preview"
          >
            {screens.map((item) => (
              <a
                className={`flex items-center gap-3 bg-[#f5f0e8] px-3 py-3 text-xs font-black ${screen === item.id ? "bg-[#17151a] text-[#f5f0e8]" : "hover:bg-[#fb407b]"}`}
                href={`/preview?screen=${item.id}`}
                key={item.id}
              >
                <span className="font-mono text-[9px] text-[#fb407b]">
                  {item.number}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <section className="overflow-hidden border border-[#17151a]/30 bg-[#f5f0e8] shadow-[12px_12px_0_#8753ed]">
          <div className="border-[#17151a]/12 flex items-center justify-between border-b px-5 py-2 font-mono text-[8px] font-bold tracking-[0.12em] text-[#716a67]">
            <span>PREVIEW / NO AUTH</span>
            <span>
              {screens.find((item) => item.id === screen)?.number} —{" "}
              {screens.find((item) => item.id === screen)?.label}
            </span>
          </div>
          {content[screen]}
        </section>
        <section className="hidden border border-[#17151a]/15 bg-[#f5f0e8] p-7 shadow-[8px_8px_0_#fb407b] lg:block">
          <p className="font-mono text-[9px] font-bold tracking-[0.15em] text-[#fb407b]">
            НОВОЕ НАПРАВЛЕНИЕ
          </p>
          <h1 className="mt-4 text-4xl font-black leading-[0.82] tracking-[-0.1em]">
            НЕ UI-КИТ.
            <br />А ХАРАКТЕР.
          </h1>
          <p className="mt-6 text-sm leading-6 text-[#625b58]">
            Тёплая бумага, чёрная типографика, жёсткая сетка, один розовый акцент.
            Меньше «карточек ради карточек», больше редакционного ритма.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 border-b-2 border-[#17151a] pb-1 text-xs font-black"
            href="/"
          >
            НА ПУБЛИЧНУЮ ГЛАВНУЮ <ArrowUpRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
