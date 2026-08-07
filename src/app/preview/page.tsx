import Link from "next/link";
import { BrandGiftIcon } from "@/components/brand-gift-icon";
import { LocalRoleIcon } from "@/components/local-role-icon";

import {
  ArrowUpRight,
  Award,
  BarChart3,
  CalendarDays,
  Check,
  CirclePlus,
  ChevronRight,
  Clock3,
  Compass,
  Crown,
  Flame,
  Eye,
  Gamepad2,
  Gift,
  Hand,
  HandCoins,
  Heart,
  ImagePlus,
  Images,
  Lock,
  MapPin,
  Medal,
  MessageCircle,
  Music2,
  Play,
  Trophy,
  TrendingUp,
  UsersRound,
  Radio,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  UserPlus,
  ThumbsUp,
  Trash2,
  WalletCards,
  Waves,
  X,
} from "lucide-react";

export const metadata = {
  title: "Preview кабинета",
  robots: { index: false, follow: false },
};

const screens = [
  { id: "feed", label: "Главная", number: "01" },
  { id: "city", label: "Город сейчас", number: "02" },
  { id: "events", label: "События", number: "03" },
  { id: "local", label: "Создают в городе", number: "04" },
  { id: "profile", label: "Профиль", number: "05" },
  { id: "earnings", label: "Доход", number: "06" },
  { id: "bonuses", label: "Рефералы", number: "07" },
  { id: "messages", label: "Сообщения", number: "08" },
  { id: "live", label: "Эфир", number: "09" },
  { id: "story", label: "Story", number: "10" },
  { id: "onboarding", label: "Старт", number: "11" },
  { id: "rankings", label: "Рейтинги", number: "12" },
  { id: "people", label: "Люди", number: "13" },
  { id: "settings", label: "Приватность", number: "14" },
  { id: "wishes", label: "Желания", number: "15" },
  { id: "collectibles", label: "Арт-направление", number: "16" },
  { id: "collection", label: "Полка", number: "17" },
  { id: "unboxing", label: "Распаковка", number: "18" },
  { id: "wish", label: "Желание", number: "19" },
  { id: "fundraiser", label: "Сбор", number: "20" },
  { id: "fundraiser-new", label: "Создать сбор", number: "21" },
  { id: "story-new", label: "Новая story", number: "22" },
  { id: "place-new", label: "Новое место", number: "23" },
  { id: "search", label: "Поиск", number: "24" },
  { id: "wish-new", label: "Новое желание", number: "25" },
  { id: "shop", label: "Магазин", number: "26" },
  { id: "battle", label: "Битва городов", number: "27" },
  { id: "live-analytics", label: "Аналитика эфира", number: "28" },
  { id: "profile-media", label: "Мои фото", number: "29" },
  { id: "story-analytics", label: "Аналитика story", number: "30" },
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
    <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#ff5d9a] via-[#dc67db] to-[#7559ec] text-white shadow-[0_6px_16px_rgba(163,80,207,.28)]">
      <Heart className="size-5 fill-current" />
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

function AppNav({ active }: { active: string }) {
  const entries = [
    { label: "Главная", icon: Compass },
    { label: "Город", icon: MapPin },
    { label: "Чаты", icon: MessageCircle },
    { label: "Я", icon: UserRound },
  ];
  return (
    <nav className="mt-auto flex h-[70px] items-end justify-around border-t border-[#2c2036]/10 bg-white px-2 pb-2 pt-2">
      {entries.slice(0, 2).map(({ label, icon: Icon }) => (
        <span
          className={`grid place-items-center gap-1 text-[9px] font-bold ${active === label ? "text-[#7549d0]" : "text-[#93869d]"}`}
          key={label}
        >
          <Icon className="size-4" strokeWidth={active === label ? 2.5 : 1.8} />
          {label}
        </span>
      ))}
      <span className="-mt-6 grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_7px_0_#f4bfd8]">
        <CirclePlus className="size-6" />
      </span>
      {entries.slice(2).map(({ label, icon: Icon }) => (
        <span
          className={`grid place-items-center gap-1 text-[9px] font-bold ${active === label ? "text-[#7549d0]" : "text-[#93869d]"}`}
          key={label}
        >
          <Icon className="size-4" strokeWidth={active === label ? 2.5 : 1.8} />
          {label}
        </span>
      ))}
    </nav>
  );
}

function FeedScreen() {
  const liveCards = [
    {
      name: "Настя",
      viewers: "2,4K",
      src: "/preview/nastya-profile.jpg",
      position: "object-[center_38%]",
    },
    {
      name: "Макс",
      viewers: "1,2K",
      src: "/preview/max-live.jpg",
      position: "object-[center_32%]",
    },
    {
      name: "Алина",
      viewers: "846",
      src: "/preview/nastya-profile.jpg",
      position: "object-[center_50%]",
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <Mark />
          <span className="text-[17px] font-black tracking-[-0.06em]">Хочу также</span>
        </div>
        <span className="grid size-9 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#61556b]">
          <Search className="size-4" />
        </span>
      </header>
      <div className="mx-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#f0e9f5] p-1 text-center text-[10px] font-black">
        <span className="rounded-xl bg-white py-2 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.07)]">
          Для тебя
        </span>
        <span className="py-2 text-[#8b7e92]">В эфире</span>
        <span className="py-2 text-[#8b7e92]">Популярное</span>
      </div>
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-black">Сейчас в эфире</h1>
          <span className="text-[10px] font-bold text-[#8753e6]">Смотреть все ›</span>
        </div>
        <div className="flex gap-2.5 overflow-hidden">
          {liveCards.map((item) => (
            <div
              className="relative h-32 w-[108px] shrink-0 overflow-hidden rounded-2xl bg-[#4a315d] shadow-[0_8px_20px_rgba(62,35,91,.16)]"
              key={item.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic preview media */}
              <img
                loading="lazy"
                decoding="async"
                alt={`Демо эфир ${item.name}`}
                className={`size-full object-cover ${item.position}`}
                src={item.src}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
              <span className="absolute left-2 top-2 rounded-md bg-[#ff3f79] px-1.5 py-0.5 text-[8px] font-black text-white">
                LIVE
              </span>
              <span className="absolute bottom-2 left-2">
                <b className="block text-[10px] text-white">{item.name}</b>
                <small className="flex items-center gap-1 text-[8px] text-white/75">
                  <UsersRound className="size-2.5" /> {item.viewers}
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
          {people.map((person, index) => (
            <span className="flex w-14 flex-col items-center gap-1.5" key={person.name}>
              <Avatar index={index} name={person.name} />
              <b className="w-full truncate text-center text-[10px]">{person.name}</b>
              <small className="text-[9px] text-[#897c91]">
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
        <div className="space-y-2">
          {[
            { name: "Саша", note: "Только пришёл в город", index: 3 },
            { name: "Лера", note: "Собирает музыкальную тусовку", index: 2 },
          ].map((person) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-2.5 shadow-[0_5px_14px_rgba(65,43,89,.05)]"
              key={person.name}
            >
              <Avatar index={person.index} name={person.name} size="size-10" />
              <span className="min-w-0 grow">
                <b className="block text-xs">{person.name}</b>
                <small className="block truncate text-[10px] text-[#81748a]">
                  {person.note}
                </small>
              </span>
              <span className="rounded-xl bg-gradient-to-r from-[#ff6e9f] to-[#8753ed] px-2.5 py-1.5 text-[9px] font-black text-white">
                Подписаться
              </span>
            </div>
          ))}
        </div>
      </section>
      <AppNav active="Главная" />
    </div>
  );
}

function CityScreen() {
  const pulse = [
    { name: "Настя", text: "общается в «Центре»", type: "сейчас", gift: false },
    { name: "Макс", text: "начал эфир из «Музыки»", type: "LIVE", gift: false },
    {
      name: "Лера",
      text: "подарила Максу подарок в «Музыке»",
      type: "момент",
      gift: true,
    },
    {
      name: "Влад",
      text: "поднялся на 3 места в рейтинге",
      type: "↑ рейтинг",
      gift: false,
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#7549d0]">
          <MapPin className="size-5" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#8b7e92]">
            Твой город
          </small>
          <h1 className="text-base font-black">Будённовск</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-xl text-white">
          +
        </span>
      </header>
      <section className="mx-4 overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-[#2e2250] via-[#49316e] to-[#7459d7] p-5 text-white shadow-[0_12px_28px_rgba(63,37,98,.24)]">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb7d0]">
          Город сейчас
        </p>
        <h2 className="mt-2 text-3xl font-black leading-[0.88] tracking-[-0.08em]">
          НЕ ГДЕ-ТО.
          <br />А РЯДОМ.
        </h2>
        <p className="text-white/72 mt-3 max-w-52 text-[11px] leading-5">
          Смотри, кто сейчас здесь, куда зайти и что уже происходит.
        </p>
        <div className="mt-5 flex gap-2">
          <span className="bg-white/14 rounded-full px-2.5 py-1 text-[9px] font-black">
            18 в городе
          </span>
          <span className="bg-white/14 rounded-full px-2.5 py-1 text-[9px] font-black">
            4 места живые
          </span>
        </div>
      </section>
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black">Сейчас происходит</h2>
          <span className="text-[10px] font-bold text-[#8753e6]">Обновляется</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#2c2036]/10 bg-white">
          {pulse.map((item, index) => (
            <div
              className="border-[#2c2036]/8 flex items-center gap-3 border-b px-3 py-3 last:border-0"
              key={item.name}
            >
              <Avatar index={index} name={item.name} size="size-10" />
              <span className="min-w-0 grow">
                <b className="block text-[11px]">{item.name}</b>
                <small className="block truncate text-[10px] text-[#81748a]">
                  {item.text}
                </small>
              </span>
              {item.gift ? (
                <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d54279]">
                  <BrandGiftIcon className="size-5" code="heart" />
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-1 text-[8px] font-black ${index === 1 ? "bg-[#ffe5ef] text-[#d54279]" : "bg-[#f1e9ff] text-[#7549d0]"}`}
                >
                  {item.type}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black">Куда зайдём?</h2>
          <span className="text-[10px] font-bold text-[#8753e6]">Все места ›</span>
        </div>
        <div className="flex gap-2.5 overflow-hidden">
          {[
            {
              icon: MapPin,
              name: "Центр",
              online: "6 сейчас",
              color: "from-[#f4e7ff] to-[#eaf6ff]",
              accent: "text-[#8753e6]",
            },
            {
              icon: Music2,
              name: "Музыка",
              online: "4 сейчас",
              color: "from-[#ffe8f1] to-[#fff0dc]",
              accent: "text-[#d84b81]",
            },
            {
              icon: Gamepad2,
              name: "Игровая",
              online: "3 сейчас",
              color: "from-[#e7f7f3] to-[#e9efff]",
              accent: "text-[#238b83]",
            },
          ].map(({ icon: Icon, ...place }) => (
            <div
              className={`w-28 shrink-0 rounded-2xl bg-gradient-to-br ${place.color} p-3`}
              key={place.name}
            >
              <Icon className={`size-5 ${place.accent}`} />
              <b className="mt-5 block text-[11px]">{place.name}</b>
              <small className="mt-0.5 flex items-center gap-1 text-[9px] text-[#756b80]">
                <UsersRound className="size-3" /> {place.online}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-4 mt-6 rounded-2xl border border-[#ffe0aa] bg-[#fff8e9] p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#ffdf82] text-[#a87714]">
            <Trophy className="size-5" />
          </span>
          <span className="grow">
            <b className="block text-[11px]">Кто вырос за неделю</b>
            <small className="block text-[10px] text-[#826f4b]">
              Влад +3 позиции · Настя в топ-10
            </small>
          </span>
          <span className="text-[10px] font-black text-[#a87714]">Рейтинг ›</span>
        </div>
      </section>
      <AppNav active="Город" />
    </div>
  );
}

function EventsScreen() {
  const today = [
    {
      title: "Музыка во дворе",
      time: "Сегодня · 19:30",
      place: "Музыка",
      author: "Макс",
      people: "12 идут",
      icon: Music2,
      tone: "bg-[#efe9ff] text-[#7650d2]",
    },
    {
      title: "Прогулка к озеру",
      time: "Сегодня · 20:00",
      place: "Будённовск",
      author: "Лера",
      people: "Ты идёшь",
      icon: UsersRound,
      tone: "bg-[#eaf7f5] text-[#258b82]",
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Программа города
          </small>
          <b className="block text-sm">События</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white">
          <CirclePlus className="size-5" />
        </span>
      </header>
      <section className="mx-4 rounded-[1.7rem] bg-gradient-to-br from-[#332357] via-[#59407f] to-[#8470dd] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <CalendarDays className="size-3.5" /> Городская сцена
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ПЛАНЫ
          <br />
          БУДЁННОВСКА.
        </h1>
        <p className="max-w-62 mt-3 text-[10px] leading-5 text-white/75">
          Встречи и идеи, которые люди открыли для своих. Никакой выдуманной активности.
        </p>
        <span className="text-white/82 mt-4 flex items-center gap-2 text-[9px] font-bold">
          <span className="size-2 rounded-full bg-[#63d9ad]" /> Только реальные
          публичные планы
        </span>
      </section>
      <div className="mx-4 mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[#eee8f4] p-1 text-center text-[10px] font-black">
        <span className="rounded-xl bg-white py-2.5 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]">
          Будённовск
        </span>
        <span className="py-2.5 text-[#82758a]">Вся платформа</span>
      </div>
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Сегодня</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              То, ради чего стоит выйти
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            2
          </span>
        </div>
        <div className="space-y-2.5">
          {today.map(
            ({ title, time, place, author, people, icon: Icon, tone }, index) => (
              <div
                className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.06)]"
                key={title}
              >
                <div className="flex gap-3">
                  <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#f0e9ff] text-[#6e49cf]">
                    <b className="text-base leading-none">0{6 + index}</b>
                    <small className="mt-1 text-[9px] font-black uppercase">авг</small>
                  </span>
                  <span className="min-w-0 grow">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#876f96]">
                      <span
                        className={`grid size-5 place-items-center rounded-lg ${tone}`}
                      >
                        <Icon className="size-3" />
                      </span>
                      {index === 0 ? "Музыка и сцена" : "Прогулка"}
                    </span>
                    <b className="mt-1.5 block text-sm">{title}</b>
                    <small className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-[#766a7d]">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5 text-[#8753e6]" /> {time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-[#258b82]" /> {place}
                      </span>
                    </small>
                  </span>
                </div>
                <div className="border-[#2c2036]/7 mt-3 flex items-center justify-between border-t pt-2.5">
                  <span className="flex items-center gap-2">
                    <Avatar index={index + 1} name={author} size="size-7" />
                    <b className="text-[10px] text-[#685c70]">{author}</b>
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#756a7d]">
                    {index === 1 ? (
                      <Check className="size-3.5 text-[#258b82]" />
                    ) : (
                      <UsersRound className="size-3.5 text-[#8753e6]" />
                    )}
                    {people}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
      <section className="mx-4 mt-5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4d7169]">
        <span className="flex items-start gap-2 text-[10px] leading-4">
          <CheckCirclePreview /> Участие добровольное: личные чаты и точная геолокация
          не попадают в городскую сцену.
        </span>
      </section>
      <AppNav active="Город" />
    </div>
  );
}

function CheckCirclePreview() {
  return <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />;
}

function RankingsScreen() {
  const peopleInRank = [
    {
      rank: 1,
      name: "Настя",
      note: "Мастер маникюра у ДК",
      index: 0,
      state: "Заметна в городе",
    },
    {
      rank: 2,
      name: "Макс",
      note: "Музыка и эфиры",
      index: 1,
      state: "Выходит в эфир",
    },
    {
      rank: 3,
      name: "Лера",
      note: "Собирает прогулки",
      index: 2,
      state: "В разговорах города",
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Репутация города
          </small>
          <b className="block text-sm">Рейтинги</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Trophy className="size-4.5" />
        </span>
      </header>
      <section className="mx-4 rounded-[1.7rem] bg-gradient-to-br from-[#342556] via-[#57407e] to-[#816ede] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <MapPin className="size-3.5" /> Будённовск
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          КТО ЗАМЕТЕН
          <br />
          СЕЙЧАС.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Публичная репутация людей, которые создают движение в городе.
        </p>
        <div className="bg-white/13 mt-4 flex items-center gap-3 rounded-2xl p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-sm font-black">
            #4
          </span>
          <span className="grow">
            <small className="text-white/62 block text-[9px] font-black uppercase tracking-[0.09em]">
              Твоя позиция
            </small>
            <b className="block text-[11px]">Лица города</b>
          </span>
          <ChevronRightPreview />
        </div>
      </section>
      <div className="mx-4 mt-4 flex gap-1 overflow-hidden rounded-2xl bg-[#eee8f4] p-1 text-[10px] font-black">
        <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]">
          <Trophy className="size-3.5" /> Главное
        </span>
        <span className="flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[#82758a]">
          <TrendingUp className="size-3.5" /> Рост недели
        </span>
        <span className="flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[#82758a]">
          <UsersRound className="size-3.5" /> В разговоре
        </span>
      </div>
      <section className="border-[#2c2036]/8 mx-4 mt-5 rounded-[1.45rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#f3ebff] text-[#7549d0]">
            <Trophy className="size-5" />
          </span>
          <span>
            <h2 className="text-sm font-black">Лица города</h2>
            <p className="mt-1 text-[10px] leading-4 text-[#756a7d]">
              Кого сейчас чаще замечают в публичной городской жизни.
            </p>
          </span>
        </div>
      </section>
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Сейчас в подборке</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Позиция следует за публичной активностью
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            3
          </span>
        </div>
        <div className="space-y-2.5">
          {peopleInRank.map((person) => (
            <div
              className="border-[#2c2036]/9 flex items-center gap-3 rounded-[1.4rem] border bg-white p-3 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
              key={person.name}
            >
              <span
                className={`grid size-10 place-items-center rounded-2xl text-xs font-black ${person.rank === 1 ? "bg-[#fff4d8] text-[#a87511]" : person.rank === 2 ? "bg-[#edf0f7] text-[#66718b]" : "bg-[#fff0e8] text-[#b66c42]"}`}
              >
                {person.rank === 1 ? <Crown className="size-4" /> : `#${person.rank}`}
              </span>
              <Avatar index={person.index} name={person.name} size="size-11" />
              <span className="min-w-0 grow">
                <b className="block text-xs">{person.name}</b>
                <small className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-[#796d80]">
                  <Sparkles className="size-3.5 shrink-0 text-[#8753e6]" />{" "}
                  {person.note}
                </small>
                <small className="mt-1 block truncate text-[9px] font-bold text-[#a094a7]">
                  {person.state}
                </small>
              </span>
              <ChevronRightPreview />
            </div>
          ))}
        </div>
      </section>
      <section className="mx-4 mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Место нельзя купить: бонусы и продвижение не добавляют позицию напрямую.
        </p>
      </section>
      <AppNav active="Город" />
    </div>
  );
}

function ChevronRightPreview() {
  return <ChevronRight className="size-4 shrink-0 text-[#9d90a4]" />;
}

function PeopleScreen() {
  const cityPeople = [
    {
      name: "Настя",
      identity: "Мастер маникюра у ДК",
      context: "Показывает новую story",
      icon: Sparkles,
      index: 0,
      circle: true,
    },
    {
      name: "Макс",
      identity: "Музыка и эфиры",
      context: "В эфире: Песни во дворе",
      icon: Radio,
      index: 1,
      circle: false,
    },
    {
      name: "Лера",
      identity: "Собирает прогулки",
      context: "Сейчас в «Центре»",
      icon: MapPin,
      index: 2,
      circle: false,
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Свои люди
          </small>
          <b className="block text-sm">Люди</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <UsersRound className="size-4.5" />
        </span>
      </header>
      <section className="mx-4 rounded-[1.7rem] bg-gradient-to-br from-[#322452] via-[#543d7a] to-[#7b67d8] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <MapPin className="size-3.5" /> Будённовск
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          НАЙДИ
          <br />
          СВОИХ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Открывай людей через их stories, эфиры, события и публичные места.
        </p>
      </section>
      <div className="mx-4 mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[#eee8f4] p-1 text-center text-[10px] font-black">
        <span className="rounded-xl bg-white py-2.5 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]">
          Будённовск
        </span>
        <span className="py-2.5 text-[#82758a]">Вся платформа</span>
      </div>
      <div className="border-[#2c2036]/9 mx-4 mt-4 flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-[0_5px_15px_rgba(69,43,94,.04)]">
        <Search className="size-4 text-[#8d7f96]" />
        <span className="grow text-[10px] font-medium text-[#a99eae]">
          Имя, ник или чем человек живёт…
        </span>
        <span className="grid size-7 place-items-center rounded-xl bg-[#f2ecfa] text-[#7549d0]">
          <Search className="size-3.5" />
        </span>
      </div>
      <div className="mx-4 mt-4 flex gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7549d0] px-3 py-2 text-[10px] font-black text-white">
          <UsersRound className="size-3.5" /> Все
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[10px] font-black text-[#786a81]">
          <Radio className="size-3.5" /> Сейчас
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[10px] font-black text-[#786a81]">
          <Sparkles className="size-3.5" /> Создают
        </span>
      </div>
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Люди рядом</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Сначала твой круг и живой контекст
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            3
          </span>
        </div>
        <div className="space-y-2.5">
          {cityPeople.map(({ name, identity, context, icon: Icon, index, circle }) => (
            <div
              className="border-[#2c2036]/9 rounded-[1.45rem] border bg-white p-3 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
              key={name}
            >
              <div className="flex items-center gap-3">
                <Avatar index={index} name={name} size="size-12" />
                <span className="min-w-0 grow">
                  <span className="flex items-center gap-2">
                    <b className="truncate text-sm">{name}</b>
                    {circle && (
                      <small className="rounded-full bg-[#f0eaff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                        В твоём круге
                      </small>
                    )}
                  </span>
                  <small className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-[#796d80]">
                    <Sparkles className="size-3.5 shrink-0 text-[#8753e6]" /> {identity}
                  </small>
                </span>
                <ChevronRightPreview />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#faf7fc] px-3 py-2 text-[10px] font-bold text-[#6d5c7a]">
                <span className="grid size-6 place-items-center rounded-lg bg-[#f0e9ff] text-[#8753e6]">
                  <Icon className="size-3.5" />
                </span>
                <span className="grow truncate">{context}</span>
                <ChevronRightPreview />
              </div>
            </div>
          ))}
        </div>
      </section>
      <AppNav active="Город" />
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Твой контроль
          </small>
          <b className="block text-sm">Настройки</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Check className="size-4.5" />
        </span>
      </header>
      <section className="mx-4 rounded-[1.7rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Check className="size-3.5" /> Приватность по умолчанию
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ТЫ РЕШАЕШЬ,
          <br />
          ЧТО ВИДИТ ГОРОД.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Городская сцена строится только из добровольно открытых действий.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="bg-white/14 rounded-full px-2 py-1 text-[8px] font-black">
            Профиль открыт
          </span>
          <span className="bg-white/14 rounded-full px-2 py-1 text-[8px] font-black">
            Город виден
          </span>
          <span className="bg-white/14 rounded-full px-2 py-1 text-[8px] font-black">
            Моменты выключены
          </span>
        </div>
      </section>
      <section className="border-[#2c2036]/9 mx-4 mt-5 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
            <MapPin className="size-4" />
          </span>
          <span>
            <b className="block text-xs">Твой город</b>
            <small className="block text-[9px] text-[#81748a]">
              Для людей, мест и программы
            </small>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#fbf9fe] p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <MapPin className="size-4" />
          </span>
          <span className="grow">
            <b className="block text-[10px]">Показывать город в профиле</b>
            <small className="block text-[9px] leading-4 text-[#81748a]">
              Точный адрес и геолокация не показываются.
            </small>
          </span>
          <span className="flex h-5 w-9 rounded-full bg-[#7c55dc] p-0.5">
            <span className="block size-4 translate-x-4 rounded-full bg-white" />
          </span>
        </div>
      </section>
      <section className="border-[#2c2036]/9 mx-4 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Sparkles className="size-4" />
          </span>
          <span>
            <b className="block text-xs">Публичные моменты</b>
            <small className="block text-[9px] text-[#81748a]">
              Только то, чем ты хочешь делиться
            </small>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#fbf9fe] p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <Sparkles className="size-4" />
          </span>
          <span className="grow">
            <b className="block text-[10px]">Показывать мои моменты</b>
            <small className="block text-[9px] leading-4 text-[#81748a]">
              Только если все участники согласились.
            </small>
          </span>
          <span className="flex h-5 w-9 rounded-full bg-[#d7cedf] p-0.5">
            <span className="block size-4 rounded-full bg-white" />
          </span>
        </div>
        <p className="mt-3 flex gap-2 rounded-xl bg-[#f8f5fb] p-2.5 text-[9px] leading-4 text-[#756a7d]">
          <Check className="mt-0.5 size-3.5 shrink-0 text-[#8753e6]" /> Личные сообщения
          и платные запросы никогда не становятся моментами города.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mx-4 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#fbf9fe] p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#eef2ff] text-[#536cb8]">
            <UserRound className="size-4" />
          </span>
          <span className="grow">
            <b className="block text-[10px]">Личные сообщения</b>
            <small className="block text-[9px] text-[#81748a]">
              Разрешить обычный приватный диалог
            </small>
          </span>
          <span className="flex h-5 w-9 rounded-full bg-[#7c55dc] p-0.5">
            <span className="block size-4 translate-x-4 rounded-full bg-white" />
          </span>
        </div>
      </section>
      <button className="mx-4 mt-5 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]">
        Сохранить настройки
      </button>
      <AppNav active="Я" />
    </div>
  );
}

function WishesScreen() {
  const wishes = [
    {
      title: "Камера для первых съёмок",
      category: "Фото и видео",
      tone: "bg-[#f3e8ff] text-[#8753e6]",
      count: "18",
    },
    {
      title: "Поехать к морю весной",
      category: "Путешествия",
      tone: "bg-[#eaf7f5] text-[#258b82]",
      count: "7",
    },
    {
      title: "Собрать домашнюю студию",
      category: "Музыка",
      tone: "bg-[#fff0f6] text-[#d84b81]",
      count: "",
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Хочу также
          </small>
          <b className="block text-sm">Желания</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white">
          <CirclePlus className="size-5" />
        </span>
      </header>
      <section className="mx-4 rounded-[1.7rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          <Heart className="size-3.5" /> Не список покупок
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ТВОИ
          <br />
          ЖЕЛАНИЯ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-[#756a7d]">
          То, к чему хочется прийти и чем можно поделиться со своими.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-3 py-2 text-[9px] font-black text-white">
          <CirclePlus className="size-3.5" /> Добавить желание
        </span>
      </section>
      <div className="mx-4 mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#ebe5f1] p-1 text-center text-[10px] font-black">
        <span className="rounded-xl bg-white py-2.5 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]">
          Мои
        </span>
        <span className="py-2.5 text-[#82758a]">
          <MapPin className="mr-1 inline size-3" />
          Город
        </span>
        <span className="py-2.5 text-[#82758a]">Платформа</span>
      </div>
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Твой список</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Публичные и личные истории
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            3
          </span>
        </div>
        <div className="space-y-2.5">
          {wishes.map((wish, index) => (
            <div
              className="border-[#2c2036]/9 rounded-[1.4rem] border bg-white p-3 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
              key={wish.title}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-14 place-items-center rounded-2xl ${wish.tone}`}
                >
                  {index === 0 ? (
                    <CameraPreview />
                  ) : index === 1 ? (
                    <MapPin className="size-5" />
                  ) : (
                    <Music2 className="size-5" />
                  )}
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-[11px]">{wish.title}</b>
                  <small className="mt-1 flex items-center gap-1.5 text-[9px] text-[#796d80]">
                    <Sparkles className="size-3 text-[#8753e6]" /> {wish.category}
                  </small>
                </span>
                <ChevronRightPreview />
              </div>
              <div className="border-[#2c2036]/7 mt-3 flex items-center justify-between border-t pt-2">
                <span className="text-[9px] font-black text-[#8753e6]">
                  Редактировать
                </span>
                {wish.count ? (
                  <span className="rounded-full border border-[#e1d6e7] bg-white px-2 py-1 text-[9px] font-bold text-[#756a7d]">
                    <Sparkles className="mr-1 inline size-3" />
                    {wish.count}
                  </span>
                ) : (
                  <span className="text-[9px] text-[#8d8094]">Твоя история</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-4 mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Личное желание видишь только ты. Публичное можно показать в профиле или
          обсудить.
        </p>
      </section>
      <AppNav active="Главная" />
    </div>
  );
}

function CameraPreview() {
  return <Sparkles className="size-5" />;
}

function LocalScreen() {
  const creators = [
    {
      name: "Настя",
      role: "beauty",
      headline: "Показываю новые работы и собираю бьюти-встречи",
      state: "Новая story",
      index: 0,
    },
    {
      name: "Макс",
      role: "music",
      headline: "Играю, пишу музыку и выхожу в эфир",
      state: "В эфире",
      index: 1,
    },
    {
      name: "Дима",
      role: "photo",
      headline: "Снимаю город и людей, которые его создают",
      state: "Событие",
      index: 2,
    },
  ];
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8753e6]">
          <MapPin className="size-5" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#8b7e92]">
            Будённовск
          </small>
          <h1 className="text-base font-black">Создают в городе</h1>
        </span>
        <span className="w-10" />
      </header>
      <section className="mx-4 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#f3e8ff] via-[#fff6fb] to-[#e7f4ff] p-5 shadow-[0_14px_32px_rgba(95,57,130,.12)]">
        <div className="flex items-start justify-between">
          <span>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8753e6]">
              Не реклама на всю страну
            </p>
            <h2 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.07em]">
              Будь заметным
              <br />
              среди своих.
            </h2>
          </span>
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#8753e6] shadow-[0_5px_14px_rgba(92,54,126,.09)]">
            <Sparkles className="size-6" />
          </span>
        </div>
        <p className="mt-4 max-w-64 text-[11px] leading-5 text-[#6e6178]">
          Показывай, что делаешь в городе: stories, эфиры, места и события. Без каталога
          услуг и навязчивой записи.
        </p>
      </section>
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black">Кого сейчас смотрят</h2>
          <span className="text-[10px] font-bold text-[#8753e6]">Все ›</span>
        </div>
        <div className="space-y-2.5">
          {creators.map((creator) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-3 shadow-[0_5px_14px_rgba(65,43,89,.05)]"
              key={creator.name}
            >
              <Avatar index={creator.index} name={creator.name} size="size-11" />
              <span className="grid size-8 place-items-center rounded-lg bg-[#f1e9ff] text-[#8753e6]">
                <LocalRoleIcon className="size-4" code={creator.role} />
              </span>
              <span className="min-w-0 grow">
                <b className="block text-[11px]">{creator.name}</b>
                <small className="block truncate text-[10px] text-[#81748a]">
                  {creator.headline}
                </small>
              </span>
              <span className="text-[9px] font-black text-[#8753e6]">
                {creator.state}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-4 mt-6 rounded-2xl border border-[#d9c5f3] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f0e7ff] text-[#8753e6]">
            <LocalRoleIcon className="size-5" code="other" />
          </span>
          <span className="grow">
            <b className="block text-[11px]">Твоя локальная витрина</b>
            <small className="block text-[10px] text-[#81748a]">
              Чем занимаешься и что сейчас показываешь
            </small>
          </span>
          <span className="text-[#8753e6]">›</span>
        </div>
      </section>
      <AppNav active="Город" />
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Будённовск
          </small>
          <b className="block text-sm">Своя история</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#74677d]">
          <X className="size-4" />
        </span>
      </header>
      <section className="mx-4 rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-[#f7ebff] via-[#fff8fc] to-[#eaf6ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.09)]">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-0.5">
            <span className="grid size-full overflow-hidden rounded-full bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic preview media */}
              <img
                loading="lazy"
                decoding="async"
                alt="Аватар Насти"
                className="size-full object-cover object-[center_40%]"
                src="/preview/nastya-profile.jpg"
              />
            </span>
          </span>
          <div className="flex gap-2">
            <button className="rounded-xl border border-[#e1cff2] bg-white px-3 py-2 text-[10px] font-black text-[#7549d0]">
              Подарок
            </button>
            <button className="rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-3 py-2 text-[10px] font-black text-white">
              Подписаться
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-[-0.06em]">Настя</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-1 text-[9px] font-black text-[#7549d0]">
            <Sparkles className="size-3" /> Автор
          </span>
          <span className="rounded-full border border-[#c5e7dc] bg-[#effaf5] px-2 py-1 text-[9px] font-black text-[#258b82]">
            Активный
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#756a7d]">
          @nastya <span className="size-1 rounded-full bg-[#b0a5b7]" />
          <MapPin className="size-3" /> Будённовск
        </p>
        <p className="mt-4 max-w-72 text-[11px] leading-5 text-[#5f5369]">
          Музыка, люди и истории, которые хочется продолжать вместе.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/75 p-3 text-[#5d4c6b]">
          <span className="grid size-8 place-items-center rounded-xl bg-[#ff4d78] text-white">
            <Radio className="size-4" />
          </span>
          <span className="grow">
            <small className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#d84b81]">
              <span className="size-1.5 rounded-full bg-[#ff4d78]" /> В эфире
            </small>
            <b className="block text-[10px]">Песни во дворе</b>
          </span>
          <ChevronRightPreview />
        </div>
        <div className="mt-4 flex gap-5 text-center">
          <span>
            <b className="block text-sm">12,4K</b>
            <small className="text-[9px] text-[#8c8095]">Подписчики</small>
          </span>
          <span>
            <b className="block text-sm">8</b>
            <small className="text-[9px] text-[#8c8095]">Желания</small>
          </span>
          <span>
            <b className="block text-sm">6</b>
            <small className="text-[9px] text-[#8c8095]">Фото</small>
          </span>
        </div>
      </section>
      <section className="border-[#2c2036]/9 mx-4 mt-4 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <LocalRoleIcon className="size-4" code="beauty" />
          </span>
          <span className="grow">
            <small className="text-[8px] font-black uppercase tracking-[0.1em] text-[#8753e6]">
              Создаёт в Будённовске
            </small>
            <b className="mt-0.5 block text-[11px]">Мастер маникюра у ДК</b>
            <small className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-[#7549d0]">
              Новая story <ChevronRight className="size-3" />
            </small>
          </span>
        </div>
        <div className="border-[#2c2036]/8 mt-3 border-t pt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d8] px-2 py-1 text-[9px] font-black text-[#a87511]">
            <Trophy className="size-3" /> #4 в городе
          </span>
        </div>
      </section>
      <div className="mt-5 grid grid-cols-3 border-y border-[#2c2036]/10 text-center text-[10px] font-bold">
        <span className="border-b-2 border-[#f45293] py-3 text-[#7549d0]">Обо мне</span>
        <span className="py-3 text-[#887b91]">Stories</span>
        <span className="py-3 text-[#887b91]">Посты</span>
      </div>
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <span className="aspect-square rounded-xl bg-gradient-to-br from-[#f3e8ff] to-[#fff1f7]" />
          <span className="aspect-square rounded-xl bg-gradient-to-br from-[#eef7f6] to-[#edf1ff]" />
          <span className="aspect-square rounded-xl bg-gradient-to-br from-[#fff5e9] to-[#fff0f6]" />
        </div>
      </section>
      <AppNav active="Я" />
    </div>
  );
}

function CollectiblesScreen() {
  const directions = [
    {
      title: "Игровые артефакты · выбрано",
      note: "Доработанный единый set: десять редких игровых предметов в gallery-подаче.",
      src: "/preview/collectibles/game-artifacts-selected.jpg",
      tone: "bg-[#f0e9ff] text-[#7549d0]",
    },
    {
      title: "Галерея героев",
      note: "Десять персонажей в одном модном художественном мире.",
      src: "/preview/collectibles/surreal-gallery-matrix.jpg",
      tone: "bg-[#fff0f6] text-[#d84b81]",
    },
    {
      title: "Мягкие коллекционные фигуры",
      note: "Более персонажный и игрушечный путь — проверяем, не слишком ли cute.",
      src: "/preview/collectibles/character-matrix.jpg",
      tone: "bg-[#eaf7f5] text-[#258b82]",
    },
  ];
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Флагманский дроп
          </small>
          <b className="block text-sm">Первые десять</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Sparkles className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#322452] via-[#543d7a] to-[#7b67d8] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> ХОЧУ / ОБЪЕКТЫ 01
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          НЕ ИКОНКИ.
          <br />
          ДЕСЯТЬ ВЕЩЕЙ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Сначала выбираем художественный мир. Серии, номера и распаковка появятся после
          выбора.
        </p>
      </section>
      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Три направления</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Synthetic art research · не финальные арты
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            10 × 3
          </span>
        </div>
        <div className="space-y-4">
          {directions.map((direction, index) => (
            <article
              className="border-[#2c2036]/9 overflow-hidden rounded-[1.45rem] border bg-white shadow-[0_8px_22px_rgba(69,43,94,.06)]"
              key={direction.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic concept art */}
              <img
                loading="lazy"
                decoding="async"
                alt={`Концепт коллекции: ${direction.title}`}
                className="aspect-[5/3] w-full object-cover"
                src={direction.src}
              />
              <div className="p-3.5">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[8px] font-black ${direction.tone}`}
                >
                  НАПРАВЛЕНИЕ 0{index + 1}
                </span>
                <h3 className="mt-2 text-xs font-black">{direction.title}</h3>
                <p className="mt-1 text-[10px] leading-4 text-[#756a7d]">
                  {direction.note}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-black text-[#8753e6]">
                  10 лимитированных фигур <ChevronRight className="size-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          После выбора одного направления фиксируем десять силуэтов, тиражи и витрину.
          Распаковка — следующий слой.
        </p>
      </section>
    </div>
  );
}

function CollectionScreen() {
  const artifacts = [
    ["key", "Ключ", "300", "39"],
    ["relic", "Реликвия", "250", "59"],
    ["compass", "Компас", "200", "79"],
    ["cube", "Куб", "175", "99"],
    ["lantern", "Фонарь", "150", "119"],
    ["prism", "Призма", "100", "149"],
    ["vial", "Флакон", "80", "179"],
    ["seal", "Печать", "60", "219"],
    ["sphere", "Сфера", "40", "269"],
    ["orbit", "Орбита", "25", "349"],
    ["bear", "Мишка", "300", "49"],
    ["rose", "Роза", "250", "59"],
    ["heart", "Сердце", "200", "69"],
    ["butterfly", "Бабочка", "180", "79"],
    ["skate", "Скейт", "150", "89"],
    ["ring", "Кольцо", "100", "119"],
    ["car", "Машина", "80", "149"],
    ["star", "Звезда", "60", "179"],
    ["shell", "Ракушка", "40", "249"],
    ["crown", "Корона", "25", "329"],
  ] as const;
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            ХОЧУ · КОЛЛЕКЦИЯ
          </small>
          <b className="block text-sm">Коллекция</b>
        </span>
        <span className="inline-flex h-10 items-center gap-1 rounded-full bg-[#f0e9ff] px-3 text-[10px] font-black text-[#7549d0]">
          <Sparkles className="size-3.5" /> 2 800
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#322452] via-[#543d7a] to-[#7b67d8] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> Первые десять
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ДЕСЯТЬ
          <br />
          АРТЕФАКТОВ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Лимитированные игровые предметы. Номер экземпляра появляется после вручения.
        </p>
      </section>
      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Коллекция</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Выбери предмет на профиле человека
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            20
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {artifacts.map(([slug, name, left, price], index) => (
            <article
              className="border-[#2c2036]/9 overflow-hidden rounded-[1.35rem] border bg-white shadow-[0_8px_22px_rgba(69,43,94,.05)]"
              key={slug}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- generated static artifact art */}
              <img
                loading="lazy"
                decoding="async"
                alt=""
                className="aspect-square w-full object-cover"
                src={`/collectibles/artifacts/png/${slug}.png`}
              />
              <div className="p-3">
                <span className="inline-flex rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                  {index < 5 ? "ЛИМИТИРОВАННЫЙ" : index < 8 ? "РЕДКИЙ" : "ИКОНИЧЕСКИЙ"}
                </span>
                <b className="mt-2 block text-[11px]">{name}</b>
                <span className="mt-2 flex items-center justify-between text-[9px] font-black">
                  <span className="text-[#8b6a9c]">{left} шт.</span>
                  <span className="text-[#7549d0]">{price} ⭐</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.45rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Твоя полка</h2>
            <p className="mt-0.5 text-[9px] text-[#82758a]">
              Даритель остаётся приватным
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            1
          </span>
        </div>
        <div className="mt-3 flex gap-3 rounded-2xl bg-[#fbf9fe] p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated static artifact art */}
          <img
            loading="lazy"
            decoding="async"
            alt="Фонарь"
            className="h-24 w-[72px] rounded-xl object-cover"
            src="/collectibles/artifacts/lantern.jpg"
          />
          <span className="grow">
            <b className="block text-[11px]">Фонарь</b>
            <small className="mt-1 block text-[9px] font-black text-[#8753e6]">
              #047 / 150
            </small>
            <small className="mt-1 block text-[8px] text-[#82758a]">
              Получен 7 авг.
            </small>
            <span className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#f0e9ff] py-1.5 text-[8px] font-black text-[#7549d0]">
              <Check className="size-2.5" /> В профиле
            </span>
          </span>
        </div>
      </section>
      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Предметы не дают боевых статов и не влияют на рейтинг. Это коллекция и
          красивый жест.
        </p>
      </section>
    </div>
  );
}

function UnboxingScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#17131f] p-4 text-white">
      <header className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-white/55">
        <span>ХОЧУ · КОЛЛЕКЦИЯ</span>
        <span>В КОЛЛЕКЦИИ</span>
      </header>
      <section className="relative mt-5 flex grow flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_32%,rgba(181,139,242,.25),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(231,71,133,.17),transparent_35%),#211a2b] px-5 py-10 text-center">
        <span className="bg-[#8a66d8]/16 absolute -left-12 top-16 size-40 rounded-full blur-3xl" />
        <span className="bg-[#e45890]/12 absolute -right-12 bottom-10 size-40 rounded-full blur-3xl" />
        <span className="bg-white/8 relative z-10 rounded-full border border-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#e6d7ff]">
          ЛИМИТИРОВАННЫЙ ЭКЗЕМПЛЯР
        </span>
        <div className="bg-white/8 relative z-10 mt-8 w-56 overflow-hidden rounded-[1.6rem] border border-white/20 p-2 shadow-[0_20px_36px_rgba(0,0,0,.24)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated static artifact art */}
          <img
            loading="lazy"
            decoding="async"
            alt="Фонарь"
            className="aspect-square w-full rounded-[1.2rem] object-cover"
            src="/collectibles/artifacts/lantern.jpg"
          />
        </div>
        <div className="relative z-10 mt-7">
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#7549d0]">
            <Check className="size-5" />
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.07em]">Фонарь</h1>
          <p className="mt-2 text-sm text-white/70">Теперь он на твоей полке.</p>
          <span className="bg-white/12 mt-5 inline-flex rounded-full px-4 py-2 text-sm font-black text-[#f3e9ff]">
            #047 / 150
          </span>
        </div>
      </section>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <span className="bg-white/8 flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 py-3 text-[11px] font-black text-white">
          Моя полка <ChevronRight className="size-3.5" />
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-[11px] font-black text-white">
          В профиль <ChevronRight className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

function WishScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Хочу также
          </small>
          <b className="block text-sm">Желание</b>
        </span>
        <span className="w-10" />
      </header>
      <article className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_14px_32px_rgba(69,43,94,.08)]">
        <div className="flex items-start gap-4">
          <span className="grid size-28 shrink-0 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#f3e8ff] to-[#fff0f6]">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic preview media */}
            <img
              loading="lazy"
              decoding="async"
              alt=""
              className="size-full object-cover object-[center_42%]"
              src="/preview/nastya-profile.jpg"
            />
          </span>
          <span className="min-w-0 grow">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#7549d0]">
              <Sparkles className="size-3" /> Фото и видео
            </span>
            <h1 className="mt-3 text-xl font-black leading-[0.95] tracking-[-0.055em]">
              Камера для первых съёмок
            </h1>
            <span className="mt-3 inline-flex rounded-full bg-[#fff6e8] px-2 py-1 text-[9px] font-black text-[#9a7a52]">
              ~ 89 000 ₽
            </span>
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fbf9fe] p-2.5">
          <Avatar index={0} name="Настя" size="size-8" />
          <span className="grow">
            <b className="block text-[10px]">Настя</b>
            <small className="block text-[9px] text-[#82758a]">
              Автор желания · Будённовск
            </small>
          </span>
          <ChevronRightPreview />
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#5f5369]">
          Хочу начать снимать город и людей, которые создают в нём свои истории.
        </p>
        <div className="mt-5 flex gap-2">
          <span className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 text-[11px] font-black text-white">
            <Heart className="size-4" /> Хочу также · 18
          </span>
          <span className="inline-flex h-11 items-center gap-1 rounded-xl border border-[#dfd5e5] bg-white px-3 text-[10px] font-black text-[#665a72]">
            <CirclePlus className="size-3.5" /> В мой список
          </span>
        </div>
      </article>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.45rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center justify-between">
          <span>
            <h2 className="flex items-center gap-2 text-sm font-black">
              <UsersRound className="size-4 text-[#8753e6]" /> Хотят также
            </h2>
            <p className="mt-0.5 text-[9px] text-[#82758a]">Люди с похожей историей</p>
          </span>
          <span className="rounded-full bg-[#f0e9ff] px-2 py-1 text-[9px] font-black text-[#7549d0]">
            18
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          {["Макс", "Лера", "Дима", "Ксюша"].map((name, index) => (
            <span className="flex w-12 flex-col items-center gap-1" key={name}>
              <Avatar index={index + 1} name={name} size="size-9" />
              <small className="w-12 truncate text-center text-[8px] font-bold">
                {name}
              </small>
            </span>
          ))}
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.45rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <MessageCircle className="size-4 text-[#8753e6]" /> Обсуждение
        </h2>
        <div className="mt-3 rounded-xl bg-[#fbf9fe] p-3">
          <div className="flex items-center gap-2">
            <Avatar index={2} name="Лера" size="size-7" />
            <b className="text-[10px]">Лера</b>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#5f5369]">
            Твоя первая камера точно соберёт вокруг тебя истории. Жду первые кадры.
          </p>
        </div>
      </section>
    </div>
  );
}

function FundraiserScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Общая цель
          </small>
          <b className="block text-sm">Сбор</b>
        </span>
        <span className="w-10" />
      </header>
      <article className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_14px_32px_rgba(69,43,94,.08)]">
        <div className="flex items-start gap-4">
          <span className="grid size-28 shrink-0 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#fff0e3] to-[#f5e9ff]">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic preview media */}
            <img
              loading="lazy"
              decoding="async"
              alt=""
              className="size-full object-cover object-[center_42%]"
              src="/preview/max-live.jpg"
            />
          </span>
          <span className="min-w-0 grow">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#7549d0]">
              <Sparkles className="size-3" /> Музыка
            </span>
            <h1 className="mt-3 text-xl font-black leading-[0.95] tracking-[-0.055em]">
              Собрать домашнюю студию
            </h1>
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fbf9fe] p-2.5">
          <Avatar index={1} name="Макс" size="size-8" />
          <span className="grow">
            <b className="block text-[10px]">Макс</b>
            <small className="block text-[9px] text-[#82758a]">
              Автор цели · Будённовск
            </small>
          </span>
          <ChevronRightPreview />
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#5f5369]">
          Хочу собрать место для музыки, эфиров и первых живых записей.
        </p>
        <section className="mt-5 rounded-[1.35rem] bg-[#fbf9fe] p-4">
          <div className="flex items-baseline justify-between">
            <span>
              <small className="block text-[8px] font-black uppercase tracking-[0.1em] text-[#93869d]">
                Собрано
              </small>
              <b className="mt-1 block text-xl text-[#c34e79]">18 400 ₽</b>
            </span>
            <span className="text-right">
              <small className="block text-[8px] font-black uppercase tracking-[0.1em] text-[#93869d]">
                Цель
              </small>
              <b className="mt-1 block text-[11px]">65 000 ₽</b>
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7f4]">
            <span className="block h-full w-[28%] rounded-full bg-gradient-to-r from-[#ff5d9a] to-[#8254ed]" />
          </div>
          <div className="mt-3 flex gap-3 text-[9px] text-[#756a7d]">
            <span className="inline-flex items-center gap-1">
              <UsersRound className="size-3.5 text-[#8753e6]" /> 24 участвуют
            </span>
            <span>До 30 авг.</span>
          </div>
        </section>
      </article>
      <section className="mt-5 rounded-[1.45rem] border border-[#e5d5ea] bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Heart className="size-4" />
          </span>
          <span>
            <h2 className="text-sm font-black">Поддержать цель</h2>
            <p className="mt-1 text-[9px] leading-4 text-[#756a7d]">
              Сумма и видимость участия — твой выбор.
            </p>
          </span>
        </div>
        <span className="mt-3 flex rounded-xl bg-[#fff7e8] p-2.5 text-[9px] leading-4 text-[#896a27]">
          <Check className="mr-1.5 size-3.5 shrink-0" /> Тестовый режим: реальные деньги
          не списываются.
        </span>
        <span className="mt-3 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-[10px] font-black text-white">
          <Heart className="mr-1.5 size-3.5" /> Перейти к тестовому подтверждению
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.45rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <MessageCircle className="size-4 text-[#8753e6]" /> Обсуждение
        </h2>
        <div className="mt-3 rounded-xl bg-[#fbf9fe] p-3">
          <div className="flex items-center gap-2">
            <Avatar index={2} name="Лера" size="size-7" />
            <b className="text-[10px]">Лера</b>
            <span className="ml-auto rounded-full bg-[#fff6e8] px-2 py-1 text-[8px] font-black text-[#9a7a20]">
              Поддержка
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#5f5369]">
            Очень хочу услышать первый эфир из этой студии.
          </p>
        </div>
      </section>
    </div>
  );
}

function NewFundraiserScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Общая цель
          </small>
          <b className="block text-sm">Новый сбор</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <TargetPreview />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          <Sparkles className="size-3.5" /> Добровольное продолжение
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          СОБЕРИ ЛЮДЕЙ
          <br />
          ВОКРУГ ЦЕЛИ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-[#756a7d]">
          Сбор не обязателен. Создай его, когда у желания появилась отдельная история.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Какая общая цель?</b>
        <span className="mt-2 flex rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-[10px] font-semibold text-[#aaa0ae]">
          Собрать домашнюю студию
        </span>
        <b className="mt-4 block text-[10px]">Почему это важно?</b>
        <span className="mt-2 block min-h-20 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#aaa0ae]">
          Расскажи историю цели и что изменится, когда она получится.
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Heart className="size-4" />
          </span>
          <span>
            <b className="block text-[11px]">Цель и контекст</b>
            <small className="block text-[9px] text-[#81748a]">
              Связать с желанием — необязательно
            </small>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="rounded-xl bg-[#fbf9fe] p-3">
            <small className="block text-[8px] font-black text-[#93869d]">
              ЦЕЛЬ, ₽
            </small>
            <b className="mt-1 block text-[11px]">65 000</b>
          </span>
          <span className="rounded-xl bg-[#fbf9fe] p-3">
            <small className="block text-[8px] font-black text-[#93869d]">СРОК</small>
            <b className="mt-1 block text-[11px]">Необязательно</b>
          </span>
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Кто увидит сбор?</b>
        <div className="mt-3 space-y-2">
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#7549d0]">
            <span className="size-2 rounded-full bg-[#7549d0]" /> Публичный · открытая
            история
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#756a7d]">
            <span className="size-2 rounded-full bg-[#d9d0df]" /> По ссылке · не в
            выдаче
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#756a7d]">
            <span className="size-2 rounded-full bg-[#d9d0df]" /> Приватный · для
            приглашённых
          </span>
        </div>
      </section>
      <section className="mt-4 flex gap-2 rounded-xl bg-[#fff7e8] p-3 text-[9px] leading-4 text-[#896a27]">
        <Check className="mt-0.5 size-3.5 shrink-0" /> Публикация создаёт безопасный
        test-mode путь поддержки. Реальные деньги не списываются.
      </section>
      <span className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-[11px] font-black text-white">
        Опубликовать сбор
      </span>
    </div>
  );
}

function TargetPreview() {
  return <Sparkles className="size-4.5" />;
}

function IncomeIcon({ kind }: { kind: string }) {
  if (kind === "gift") return <Gift className="size-4" />;
  if (kind === "message") return <MessageCircle className="size-4" />;
  if (kind === "people") return <UsersRound className="size-4" />;
  return <Crown className="size-4" />;
}

function EarningsScreen() {
  const income = [
    {
      label: "Донаты",
      value: "58 450 ₽",
      icon: "gift",
      color: "bg-[#ffe9f2] text-[#d84b81]",
    },
    {
      label: "Платные сообщения",
      value: "19 400 ₽",
      icon: "message",
      color: "bg-[#eee6ff] text-[#8054e7]",
    },
    {
      label: "Платное общение",
      value: "24 600 ₽",
      icon: "people",
      color: "bg-[#e6f7f4] text-[#238b83]",
    },
    {
      label: "Подписки",
      value: "17 600 ₽",
      icon: "crown",
      color: "bg-[#fff1cd] text-[#a87511]",
    },
  ];
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] p-4 text-[#251d31]">
      <header className="flex items-center justify-between px-1 pt-1">
        <span className="grid size-9 place-items-center rounded-full border border-[#2c2036]/10 bg-white">
          ‹
        </span>
        <h1 className="text-sm font-black">Мой заработок</h1>
        <span className="grid size-9 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8753e6]">
          <Settings className="size-4.5" />
        </span>
      </header>
      <section className="mt-6 rounded-[1.7rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_12px_30px_rgba(65,43,89,.08)]">
        <div className="flex items-start justify-between">
          <span>
            <small className="text-[10px] text-[#81748a]">Баланс</small>
            <b className="mt-1 block text-3xl tracking-[-0.065em]">24 560 ₽</b>
          </span>
          <span className="rounded-xl bg-gradient-to-r from-[#ff6e9f] to-[#8753ed] px-3 py-2 text-[10px] font-black text-white">
            Вывести
          </span>
        </div>
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#f5edff] to-[#fff2f7] p-3.5">
          <div className="flex items-end justify-between">
            <span>
              <small className="text-[9px] text-[#7e7187]">Доход за месяц</small>
              <b className="mt-1 block text-xl">128 450 ₽</b>
            </span>
            <span className="text-[10px] font-black text-[#219668]">+23% ↗</span>
          </div>
          <div className="mt-3 flex h-7 items-end gap-1">
            {[35, 52, 43, 70, 58, 82, 100].map((value, index) => (
              <span
                className="grow rounded-t bg-gradient-to-t from-[#8753ed] to-[#ff79ab]"
                key={index}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-black">Источники дохода</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#2c2036]/10 bg-white">
          {income.map((item) => (
            <div
              className="border-[#2c2036]/8 flex items-center justify-between border-b px-4 py-3 last:border-0"
              key={item.label}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`grid size-8 place-items-center rounded-xl ${item.color}`}
                >
                  <IncomeIcon kind={item.icon} />
                </span>
                <span className="text-[11px] font-bold">{item.label}</span>
              </span>
              <b className="text-[11px]">{item.value}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-[#ffd6e7] bg-[#fff5fa] p-3 text-[10px] leading-5 text-[#7f6072]">
        <b className="text-[#c7497c]">Тестовый режим.</b> Реальные выплаты появятся
        после KYC и подключения платёжного партнёра.
      </section>
      <AppNav active="Я" />
    </div>
  );
}

function BonusesScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] p-4 text-[#251d31]">
      <header className="flex items-center justify-between px-1 pt-1">
        <span className="grid size-9 place-items-center rounded-full border border-[#2c2036]/10 bg-white">
          ‹
        </span>
        <h1 className="text-sm font-black">Приглашай друзей</h1>
        <span className="w-9" />
      </header>
      <section className="mt-6 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#f4e9ff] via-[#fff6fb] to-[#e7f4ff] p-5 shadow-[0_14px_32px_rgba(106,61,144,.12)]">
        <div className="flex items-start justify-between">
          <span>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8550c8]">
              Будённовск / твой город
            </p>
            <h2 className="mt-2 max-w-48 text-2xl font-black leading-[0.95] tracking-[-0.07em]">
              Пригласи активного пользователя
            </h2>
          </span>
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#8753e6] shadow-[0_6px_16px_rgba(100,54,140,.1)]">
            <BrandGiftIcon className="size-7" code="party" />
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <span>
            <small className="text-[10px] text-[#816e8b]">На свой баланс</small>
            <b className="mt-1 flex items-center gap-2 text-5xl leading-none tracking-[-0.1em] text-[#d84492]">
              200 <Sparkles className="size-8 stroke-[2.4]" />
            </b>
          </span>
          <span className="rounded-full bg-[#fff0b9] px-2.5 py-1 text-[9px] font-black text-[#846114]">
            после активности
          </span>
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
        <div className="flex items-center justify-between">
          <span>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8753e6]">
              Твоя ссылка
            </p>
            <p className="mt-1 text-[10px] text-[#776a80]">
              В Будённовск / первая волна
            </p>
          </span>
          <span className="grid size-10 place-items-center rounded-xl bg-[#f3edff] text-[#8753e6]">
            ⌗
          </span>
        </div>
        <div className="mt-3 flex h-9 items-center rounded-xl bg-[#f8f4fb] px-3 text-[9px] text-[#83758c]">
          hochutakzhe.ru/r/nastya?city=budennovsk
        </div>
        <button className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-2.5 text-[10px] font-black text-white">
          Пригласить друзей
        </button>
      </section>
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black">Кто по твоей ссылке</h2>
          <span className="text-[9px] font-bold text-[#8753e6]">17 приглашено</span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { name: "Алина", status: "Стала активной", state: "+200" },
            { name: "Максим", status: "Профиль заполнен", state: "1 шаг" },
            { name: "Кирилл", status: "Первое действие", state: "+200" },
          ].map((person, index) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-3"
              key={person.name}
            >
              <Avatar index={index} name={person.name} size="size-10" />
              <span className="grow">
                <b className="block text-[11px]">{person.name}</b>
                <small className="block text-[10px] text-[#81748a]">
                  {person.status}
                </small>
              </span>
              <b className="text-[10px] text-[#8753e6]">{person.state}</b>
            </div>
          ))}
        </div>
      </section>
      <AppNav active="Я" />
    </div>
  );
}

function MessagesScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#fbf9fe] text-[#251d31]">
      <header className="flex items-end justify-between px-4 pb-4 pt-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8753e6]">
            Общение
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.06em]">Сообщения</h1>
        </div>
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8753e6]">
          <Send className="size-4" />
        </span>
      </header>
      <div className="mx-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#f0e9f5] p-1 text-center text-[9px] font-black">
        <span className="rounded-xl bg-white py-2 text-[#7549d0] shadow-sm">Все</span>
        <span className="py-2 text-[#8b7e92]">Непрочитанные</span>
        <span className="py-2 text-[#8b7e92]">Платные</span>
      </div>
      <section className="px-4 pt-5">
        {[
          { name: "Настя", message: "Привет! Спасибо за поддержку!", unread: "1" },
          { name: "Алина", message: "Конечно, погнали вместе!", unread: "2" },
          { name: "Макс", message: "Отправляй идеи для эфира", unread: "" },
          { name: "Дима", message: "Спасибо за эфир, было круто", unread: "" },
        ].map((person, index) => (
          <div
            className="flex items-center gap-3 border-b border-[#2c2036]/10 py-3.5"
            key={person.name}
          >
            <Avatar index={index} name={person.name} />
            <span className="min-w-0 grow">
              <b className="block text-xs">{person.name}</b>
              <small className="mt-0.5 block truncate text-[10px] text-[#81748a]">
                {person.message}
              </small>
            </span>
            {person.unread ? (
              <span className="grid size-5 place-items-center rounded-full bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] text-[9px] font-black text-white">
                {person.unread}
              </span>
            ) : (
              <span className="text-[10px] text-[#a296a6]">12:45</span>
            )}
          </div>
        ))}
      </section>
      <div className="mt-auto px-5 pb-6">
        <p className="rounded-xl bg-[#f4edff] px-3 py-2.5 text-center text-[10px] leading-4 text-[#705e82]">
          Диалог открывается только после принятого запроса. Приватность остаётся у
          человека.
        </p>
      </div>
      <AppNav active="Чаты" />
    </div>
  );
}

function LiveScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская сцена
          </small>
          <b className="block text-sm">Новый эфир</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Radio className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Radio className="size-3.5" /> Запусти момент
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ВЫЙДИ К СВОИМ
          <br />В ЭФИР.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Эфир может начать разговор в городе или продолжить твою историю.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Как называется эфир?</b>
        <span className="mt-2 flex rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-[10px] font-semibold text-[#aaa0ae]">
          Музыка во дворе
        </span>
        <b className="mt-4 block text-[10px]">Что сейчас будет происходить?</b>
        <span className="mt-2 block min-h-20 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#aaa0ae]">
          Играю новые песни и собираю истории от своих.
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Sparkles className="size-4" />
          </span>
          <span>
            <b className="block text-[11px]">Контекст эфира</b>
            <small className="block text-[9px] text-[#81748a]">
              Помогает людям понять, куда они заходят
            </small>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-3 text-[10px] font-bold text-[#665a72]">
          <MapPin className="size-4 text-[#258b82]" /> Музыка · Будённовск{" "}
          <ChevronRightPreview />
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-3 text-[10px] font-bold text-[#665a72]">
          <Sparkles className="size-4 text-[#8753e6]" /> Продолжить желание «Домашняя
          студия» <ChevronRightPreview />
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#eef2ff] text-[#536cb8]">
            <UsersRound className="size-4" />
          </span>
          <span>
            <b className="block text-[11px]">Кто сможет смотреть?</b>
            <small className="block text-[9px] text-[#81748a]">
              Выбираешь до старта
            </small>
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#7549d0]">
            <span className="size-2 rounded-full bg-[#7549d0]" /> Публичный · город и
            подписчики
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#756a7d]">
            <span className="size-2 rounded-full bg-[#d9d0df]" /> По ссылке · не в общей
            сцене
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#756a7d]">
            <span className="size-2 rounded-full bg-[#d9d0df]" /> Приватный · скрыт из
            города
          </span>
        </div>
      </section>
      <section className="mt-4 flex gap-2 rounded-xl bg-[#f0faf5] p-3 text-[9px] leading-4 text-[#4c7169]">
        <Check className="mt-0.5 size-3.5 shrink-0 text-[#258b82]" /> Комната и чат
        создаются сейчас. Видео и звук появятся после настройки self-hosted LiveKit/SFU.
      </section>
      <span className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-[11px] font-black text-white">
        Создать эфир
      </span>
    </div>
  );
}

function NewStoryScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Ежедневный пульс
          </small>
          <b className="block text-sm">Новая story</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Sparkles className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> Покажи момент
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          НЕ НУЖЕН ЭФИР,
          <br />
          ЧТОБЫ БЫТЬ В ГОРОДЕ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Одна короткая story может продолжить твою историю и дать людям повод зайти к
          тебе.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Play className="size-4 fill-current" />
          </span>
          <span>
            <b className="block text-[11px]">Видео</b>
            <small className="block text-[9px] text-[#81748a]">
              Короткий вертикальный момент
            </small>
          </span>
        </div>
        <span className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] text-[10px] font-bold text-[#8753e6]">
          Выбрать видео MP4 / WebM
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Подпись</b>
        <span className="mt-2 block min-h-20 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#aaa0ae]">
          Что происходит в этом моменте?
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
            <MapPin className="size-4" />
          </span>
          <span>
            <b className="block text-[11px]">Городской контекст</b>
            <small className="block text-[9px] text-[#81748a]">
              Точная геолокация не показывается
            </small>
          </span>
        </div>
        <span className="mt-3 flex rounded-xl bg-[#f0faf5] p-3 text-[9px] leading-4 text-[#4c7169]">
          После обработки публичная story может появиться в контексте Будённовска.
        </span>
      </section>
      <section className="mt-4 flex gap-2 rounded-xl bg-[#f0faf5] p-3 text-[9px] leading-4 text-[#4c7169]">
        <Check className="mt-0.5 size-3.5 shrink-0 text-[#258b82]" /> Новые stories
        бесплатны. Paid unlock и creator payout отложены.
      </section>
      <span className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-[11px] font-black text-white">
        Опубликовать story
      </span>
    </div>
  );
}

function NewPlaceScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская сцена
          </small>
          <b className="block text-sm">Новое место</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <UsersRound className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> Собери своих
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          СОЗДАЙ НОВУЮ
          <br />
          ТОЧКУ ГОРОДА.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Место — живая комната для людей, разговора, эфира и события.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Как называется место?</b>
        <span className="mt-2 flex rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-[10px] font-semibold text-[#aaa0ae]">
          Музыка после восьми
        </span>
        <b className="mt-4 block text-[10px]">Зачем сюда заходят?</b>
        <span className="mt-2 block min-h-20 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#aaa0ae]">
          Кого и какой разговор ты хочешь собрать?
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Sparkles className="size-4" />
          </span>
          <span>
            <b className="block text-[11px]">Характер места</b>
            <small className="block text-[9px] text-[#81748a]">
              Узнаваемая иконка в городе
            </small>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[Music2, UsersRound, Gamepad2, Radio, MapPin].map((Icon, index) => (
            <span
              className={`grid min-h-14 place-items-center rounded-xl border text-[9px] font-black ${index === 0 ? "border-[#a67ae7] bg-[#f0e9ff] text-[#7549d0]" : "border-[#2c2036]/9 bg-[#fbf9fe] text-[#756a7d]"}`}
              key={index}
            >
              <Icon className="size-4" />
            </span>
          ))}
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Как долго место живёт?</b>
        <div className="mt-3 space-y-2">
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#7549d0]">
            <span className="size-2 rounded-full bg-[#7549d0]" /> Постоянная тусовка ·
            остаётся в городе
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[9px] font-bold text-[#756a7d]">
            <span className="size-2 rounded-full bg-[#d9d0df]" /> Точка на сегодня ·
            архивируется через 24 часа
          </span>
        </div>
      </section>
      <section className="mt-4 flex gap-2 rounded-xl bg-[#f0faf5] p-3 text-[9px] leading-4 text-[#4c7169]">
        <Check className="mt-0.5 size-3.5 shrink-0 text-[#258b82]" /> Место — это не
        точный адрес, не бронирование и не маркетплейс. Это открытая городская комната.
      </section>
      <span className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-[11px] font-black text-white">
        Создать место
      </span>
    </div>
  );
}

function SearchScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Открыть сцену
          </small>
          <b className="block text-sm">Поиск</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Search className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          <MapPin className="size-3.5" /> Будённовск
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          НАЙДИ,
          <br />
          КУДА ЗАЙТИ.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-[#756a7d]">
          Люди, места, желания, события и артефакты из доступных сцен.
        </p>
      </section>
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[#ebe5f1] p-1 text-center text-[10px] font-black">
        <span className="rounded-xl bg-white py-2.5 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]">
          <MapPin className="mr-1 inline size-3" /> Мой город
        </span>
        <span className="py-2.5 text-[#82758a]">
          <Compass className="mr-1 inline size-3" /> Вся платформа
        </span>
      </div>
      <div className="border-[#2c2036]/9 mt-4 flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-[0_5px_15px_rgba(69,43,94,.04)]">
        <Search className="size-4 text-[#8d7f96]" />
        <span className="grow text-[10px] font-medium text-[#5f5369]">музыка</span>
        <span className="grid size-7 place-items-center rounded-xl bg-[#f2ecfa] text-[#7549d0]">
          <Search className="size-3.5" />
        </span>
      </div>
      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Люди</h2>
            <p className="mt-0.5 text-[9px] text-[#82758a]">Открытые профили</p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            2
          </span>
        </div>
        <div className="space-y-2">
          <div className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]">
            <Avatar index={1} name="Макс" size="size-10" />
            <span className="grow">
              <b className="block text-[11px]">Макс</b>
              <small className="block text-[9px] text-[#81748a]">
                @max · Будённовск
              </small>
            </span>
            <ChevronRightPreview />
          </div>
        </div>
      </section>
      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Места</h2>
            <p className="mt-0.5 text-[9px] text-[#82758a]">
              Комнаты и точки притяжения
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            1
          </span>
        </div>
        <div className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <Music2 className="size-4.5" />
          </span>
          <span className="grow">
            <b className="block text-[11px]">Музыка после восьми</b>
            <small className="block text-[9px] text-[#81748a]">
              Комната для музыки и разговоров
            </small>
          </span>
          <ChevronRightPreview />
        </div>
      </section>
      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Желания</h2>
            <p className="mt-0.5 text-[9px] text-[#82758a]">
              Истории, которые можно продолжить
            </p>
          </span>
          <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
            1
          </span>
        </div>
        <div className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#f3e8ff] to-[#fff0f6] text-[#8753e6]">
            <Sparkles className="size-4" />
          </span>
          <span className="grow">
            <b className="block text-[11px]">Собрать домашнюю студию</b>
            <small className="block text-[9px] text-[#81748a]">Открыть историю</small>
          </span>
          <ChevronRightPreview />
        </div>
      </section>
    </div>
  );
}

function NewWishScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Личная история
          </small>
          <b className="block text-sm">Новое желание</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Heart className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#d84b81]">
          <Heart className="size-3.5" /> С чего начинается «Хочу также»
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          Назови свою
          <br />
          мечту.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-[#756a7d]">
          Желание можно оставить в профиле как историю или позже превратить в
          коллективный сбор.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Что вы хотите?</b>
        <span className="mt-2 flex rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-[10px] font-semibold text-[#aaa0ae]">
          Например, Sony A7C II
        </span>
        <b className="mt-4 block text-[10px]">Расскажите о желании</b>
        <span className="mt-2 block min-h-20 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#aaa0ae]">
          Почему это важно для вас? Что вы планируете с этим делать?
        </span>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Категория</b>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[Music2, Gamepad2, UsersRound, Sparkles].map((Icon, index) => (
            <span
              className={`grid min-h-14 place-items-center rounded-xl border text-[9px] font-black ${index === 0 ? "border-[#a67ae7] bg-[#f0e9ff] text-[#7549d0]" : "border-[#2c2036]/9 bg-[#fbf9fe] text-[#756a7d]"}`}
              key={index}
            >
              <Icon className="size-4" />
            </span>
          ))}
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-3 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Кто увидит желание?</b>
        <span className="mt-2 flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[10px] font-black text-[#7549d0]">
          <span className="grid size-4 place-items-center rounded-full bg-[#7549d0] text-white">
            <Check className="size-3" />
          </span>
          Публично — видно в профиле и городе
        </span>
        <span className="mt-1.5 flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-2.5 text-[10px] font-black text-[#756a7d]">
          <span className="grid size-4 place-items-center rounded-full border border-[#2c2036]/15" />
          Только я — скрыто от других
        </span>
      </section>
      <span className="mt-4 block rounded-2xl bg-gradient-to-r from-[#ff5c99] to-[#8c58ff] px-4 py-3 text-center text-[11px] font-black text-white shadow-[0_8px_20px_rgba(205,82,231,.28)]">
        Создать желание
      </span>
    </div>
  );
}

function ShopScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Бонусы и стиль
          </small>
          <b className="block text-sm">Магазин ⭐</b>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd35e]/50 bg-[#fff6d9] px-2.5 py-1.5 text-xs font-black text-[#a57513]">
          <Star className="size-3.5 fill-current" /> 1 240
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#2a1a4d] via-[#4b2f7a] to-[#7a4fd0] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <ShoppingBag className="size-3.5" /> Твой баланс
        </span>
        <p className="mt-3 text-4xl font-black tracking-[-0.04em]">
          1 240 <span className="text-xl text-white/70">⭐</span>
        </p>
        <p className="mt-2 text-[10px] leading-5 text-white/75">
          ⭐ — внутренние бонусы платформы: за активность, приглашения и участие в жизни
          города.
        </p>
        <div className="mt-4 rounded-2xl bg-black/20 p-3">
          <div className="flex items-center justify-between text-[10px] font-black">
            <span>Лимит трат сегодня</span>
            <span className="text-white/85">120 / 500 ⭐</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff5c99] to-[#ffd35e]"
              style={{ width: "24%" }}
            />
          </div>
        </div>
      </section>
      <section className="mt-4 rounded-[1.6rem] border border-[#ffd35e]/40 bg-gradient-to-br from-[#fff8e1] to-[#fdf0ff] p-4 shadow-[0_10px_26px_rgba(161,122,55,.1)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#ffd35e]/25 text-[#b8860b]">
              <Crown className="size-5" />
            </span>
            <div>
              <b className="block text-[11px]">VIP · 149 ⭐ / месяц</b>
              <small className="mt-0.5 block text-[9px] leading-4 text-[#756a7d]">
                Значок VIP, рамка профиля и эксклюзивные предметы
              </small>
            </div>
          </div>
        </div>
        <span className="mt-3 block rounded-xl bg-gradient-to-r from-[#ffb347] to-[#ff8c42] py-2.5 text-center text-[10px] font-black text-[#4a2c05]">
          Оформить VIP за 149 ⭐
        </span>
      </section>
      <section className="mt-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#8753e6]" />
          <b className="text-[11px]">Коллекция</b>
          <span className="rounded-full bg-[#f0e9ff] px-2 py-0.5 text-[9px] font-black text-[#7549d0]">
            ЛИМИТИРОВАННО
          </span>
        </div>
        <div className="mt-2.5 space-y-2">
          {[
            {
              icon: Waves,
              name: "Первая волна",
              rest: "97 / 100",
              tint: "text-[#2f9bb5]",
            },
            { icon: Award, name: "Золото", rest: "48 / 50", tint: "text-[#b8860b]" },
          ].map((item) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-[#e5d5ff] bg-gradient-to-r from-[#f7f0ff] to-[#fff6fb] p-3"
              key={item.name}
            >
              <span
                className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#e8d5ff] to-[#ffd9ec] ${item.tint}`}
              >
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0 grow">
                <span className="flex items-center gap-2">
                  <b className="text-[10px]">{item.name}</b>
                  <span className="rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                    {item.rest}
                  </span>
                </span>
              </span>
              <span className="rounded-xl bg-gradient-to-r from-[#a67ae7] to-[#7a4fd0] px-2.5 py-1.5 text-[9px] font-black text-white">
                499 ⭐
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-4">
        <b className="text-[11px]">Значки</b>
        <div className="mt-2.5 space-y-2">
          {[
            { icon: Flame, name: "Огонёк", price: "120 ⭐", tint: "text-[#e2574c]" },
            { icon: Music2, name: "Меломан", price: "200 ⭐", tint: "text-[#8753e6]" },
          ].map((item) => (
            <div
              className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3"
              key={item.name}
            >
              <span
                className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#f3ecff] to-[#fff0f6] ${item.tint}`}
              >
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0 grow">
                <b className="block text-[10px]">{item.name}</b>
              </span>
              <span className="rounded-xl bg-gradient-to-r from-[#ff5c99] to-[#8c58ff] px-2.5 py-1.5 text-[9px] font-black text-white">
                {item.price}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BattleScreen() {
  const rows = [
    { name: "Будённовск", points: "12 480", mine: true },
    { name: "Ставрополь", points: "11 940", mine: false },
    { name: "Пятигорск", points: "9 870", mine: false },
    { name: "Кисловодск", points: "8 210", mine: false },
    { name: "Невинномысск", points: "6 540", mine: false },
  ];
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Сезонное соревнование
          </small>
          <b className="block text-sm">Битва городов</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Trophy className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Trophy className="size-3.5" /> Сезон 2
        </span>
        <p className="mt-3 text-4xl font-black tracking-[-0.04em]">1-е место</p>
        <p className="mt-1.5 text-[10px] text-white/75">Будённовск · 12 480 баллов</p>
        <div className="mt-4 rounded-2xl bg-black/20 p-3 text-[10px] leading-5 text-white/85">
          До первого места — <b className="text-[#ffd35e]">0 баллов</b>. Ваш город
          лидирует — удержим первое место!
        </div>
      </section>
      <section className="border-[#2c2036]/9 mt-4 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <UsersRound className="size-4" />
          </span>
          <span>
            <b className="block text-[11px]">Как заработать баллы городу</b>
            <small className="block text-[9px] text-[#81748a]">
              Только реальные действия жителей
            </small>
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { icon: UserRound, label: "Заполнить профиль", points: 50 },
            { icon: UserPlus, label: "Пригласить друга", points: 100 },
            { icon: Radio, label: "Начать эфир", points: 30 },
          ].map((rule) => (
            <div
              className="flex items-center gap-2.5 rounded-xl bg-[#fbf9fe] px-3 py-2 text-[10px] text-[#5f5369]"
              key={rule.label}
            >
              <rule.icon className="size-3.5 shrink-0 text-[#8753e6]" />
              <span className="min-w-0 grow">{rule.label}</span>
              <b className="shrink-0 font-black text-[#7549d0]">+{rule.points}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-4">
        <b className="text-[11px]">Таблица лидеров</b>
        <div className="mt-2.5 space-y-2">
          {rows.map((row, index) => (
            <div
              className={`flex items-center gap-3 rounded-2xl border bg-white p-3 ${
                row.mine
                  ? "border-[#a67ae7] bg-gradient-to-r from-[#f6efff] to-[#fff6fb]"
                  : "border-[#2c2036]/9"
              }`}
              key={row.name}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                  index === 0
                    ? "bg-[#fff6d9] text-[#b8860b]"
                    : index === 1
                      ? "bg-[#eef1f5] text-[#8a93a3]"
                      : "bg-[#f7ede2] text-[#b0713a]"
                }`}
              >
                <Medal className="size-4" />
              </span>
              <span className="min-w-0 grow truncate text-[10px] font-black">
                {row.name}
                {row.mine && (
                  <span className="ml-2 rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                    ваш город
                  </span>
                )}
              </span>
              <b className="shrink-0 text-[10px] font-black text-[#8753e6]">
                {row.points}
              </b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LiveAnalyticsScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Сводка эфира
          </small>
          <b className="block text-sm">Аналитика эфира</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <BarChart3 className="size-4.5" />
        </span>
      </header>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-xs leading-5">Вечерний джем-сет в «Музыке»</b>
        <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#81748a]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f6] px-2 py-0.5 text-[9px] font-black text-[#d84b81]">
            <Radio className="size-3" /> В эфире
          </span>
          <span>создан 6 авг, 20:14</span>
        </p>
      </section>
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          { icon: UsersRound, label: "Зрители", value: "42", tint: "text-[#8753e6]" },
          {
            icon: MessageCircle,
            label: "Сообщения",
            value: "128",
            tint: "text-[#2f9bb5]",
          },
          { icon: Heart, label: "Реакции", value: "96", tint: "text-[#d84b81]" },
          { icon: Gift, label: "Подарки", value: "14", tint: "text-[#b8860b]" },
          { icon: HandCoins, label: "Донаты", value: "9", tint: "text-[#258b82]" },
          {
            icon: WalletCards,
            label: "Доход",
            value: "2 340 ₽",
            tint: "text-[#7549d0]",
          },
        ].map((stat) => (
          <div
            className="border-[#2c2036]/9 rounded-2xl border bg-white p-3.5 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
            key={stat.label}
          >
            <stat.icon className={`size-4.5 ${stat.tint}`} />
            <p className="mt-2 text-[9px] text-[#81748a]">{stat.label}</p>
            <b className="mt-0.5 block text-xl font-black">{stat.value}</b>
          </div>
        ))}
      </section>
      <section className="mt-4">
        <b className="text-[11px]">Реакции</b>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {[
            { icon: Flame, label: "Огонь", value: "31" },
            { icon: Heart, label: "Сердце", value: "27" },
            { icon: ThumbsUp, label: "Нравится", value: "24" },
            { icon: Hand, label: "Аплодисменты", value: "14" },
          ].map((reaction) => (
            <div
              className="border-[#2c2036]/9 rounded-2xl border bg-white p-2.5 text-center shadow-[0_6px_18px_rgba(69,43,94,.05)]"
              key={reaction.label}
            >
              <reaction.icon className="size-4.5 mx-auto text-[#8753e6]" />
              <b className="mt-1 block text-sm font-black">{reaction.value}</b>
              <span className="mt-0.5 block text-[8px] text-[#81748a]">
                {reaction.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileMediaScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Ваш профиль
          </small>
          <b className="block text-sm">Мои фото</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Images className="size-4.5" />
        </span>
      </header>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#d84b81]">
          <Images className="size-3.5" /> Галерея
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          До шести
          <br />
          фотографий.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-[#756a7d]">
          Первая — обложка профиля. Остальные показывают вашу историю людям, которые
          заходят в гости.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-4 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Добавить фото</b>
        <span className="mt-3 block rounded-xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] p-3 text-center text-[9px] font-black text-[#7549d0]">
          Выбрать файлы
        </span>
        <div className="mt-3 flex gap-2">
          <span className="h-10 grow rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2.5 text-[10px] font-semibold text-[#5f5369]">
            Публичные
          </span>
          <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 text-[10px] font-black text-white">
            <ImagePlus className="size-3.5" /> Добавить
          </span>
        </div>
      </section>
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          { label: "Обложка", tint: "from-[#e8d5ff] to-[#ffd9ec]", locked: false },
          { label: "#2", tint: "from-[#d5ecff] to-[#e8f5ff]", locked: false },
          { label: "#3", tint: "from-[#ffe8d5] to-[#fff5e8]", locked: true },
          { label: "#4", tint: "from-[#e5ffd9] to-[#f2ffea]", locked: false },
        ].map((photo) => (
          <div
            className="border-[#2c2036]/9 relative overflow-hidden rounded-2xl border bg-white shadow-[0_6px_18px_rgba(69,43,94,.07)]"
            key={photo.label}
          >
            <div
              className={`grid aspect-[4/3] w-full place-items-center bg-gradient-to-br ${photo.tint} text-[#8753e6]`}
            >
              <Images className="size-6" />
            </div>
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-[#5f5369]">
              {photo.label}
            </span>
            {photo.locked && (
              <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white/90 text-[#7549d0]">
                <Lock className="size-3.5" />
              </span>
            )}
            <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-[#d84b81]">
              <Trash2 className="size-4" />
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function StoryAnalyticsScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-6 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#5f5369]">
          <ArrowUpRight className="size-4 rotate-[-135deg]" />
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Сводка публикации
          </small>
          <b className="block text-sm">Аналитика story</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <BarChart3 className="size-4.5" />
        </span>
      </header>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-xs leading-5">Вечерний город с крыши</b>
        <p className="mt-1.5 text-[10px] text-[#81748a]">создана 6 авг, 21:02</p>
      </section>
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          { icon: Eye, label: "Просмотры", value: "156", tint: "text-[#8753e6]" },
          { icon: Heart, label: "Реакции", value: "34", tint: "text-[#d84b81]" },
          { icon: Gift, label: "Подарки", value: "7", tint: "text-[#b8860b]" },
          { icon: WalletCards, label: "Доход", value: "890 ₽", tint: "text-[#7549d0]" },
        ].map((stat) => (
          <div
            className="border-[#2c2036]/9 rounded-2xl border bg-white p-3.5 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
            key={stat.label}
          >
            <stat.icon className={`size-4.5 ${stat.tint}`} />
            <p className="mt-2 text-[9px] text-[#81748a]">{stat.label}</p>
            <b className="mt-0.5 block text-xl font-black">{stat.value}</b>
          </div>
        ))}
      </section>
      <section className="mt-4">
        <b className="text-[11px]">Реакции</b>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {[
            { icon: Heart, label: "Сердце", value: "18" },
            { icon: Flame, label: "Огонь", value: "11" },
            { icon: Sparkles, label: "Удивление", value: "5" },
          ].map((reaction) => (
            <div
              className="border-[#2c2036]/9 rounded-2xl border bg-white p-2.5 text-center shadow-[0_6px_18px_rgba(69,43,94,.05)]"
              key={reaction.label}
            >
              <reaction.icon className="size-4.5 mx-auto text-[#8753e6]" />
              <b className="mt-1 block text-sm font-black">{reaction.value}</b>
              <span className="mt-0.5 block text-[8px] text-[#81748a]">
                {reaction.label}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-4">
        <b className="text-[11px]">Открытия по дням</b>
        <div className="border-[#2c2036]/9 mt-2.5 flex h-24 items-end gap-1.5 rounded-2xl border bg-white p-3">
          {[4, 6, 2, 8, 5, 3, 7].map((value, index) => (
            <div
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              key={index}
            >
              <span className="text-[9px] font-black text-[#7549d0]">{value}</span>
              <div
                className="w-full rounded-md bg-gradient-to-t from-[#8254ed] to-[#ff5d9a]"
                style={{ height: `${value * 10}%`, opacity: 1 }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StoryScreen() {
  return (
    <div className="flex min-h-[730px] flex-col bg-[#0d0b12] text-white">
      <section className="relative flex min-h-[560px] flex-col overflow-hidden bg-[#30213f]">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic preview media */}
        <img
          loading="lazy"
          decoding="async"
          alt="Демо story Насти"
          className="absolute inset-0 size-full object-cover object-[center_42%]"
          src="/preview/nastya-profile.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />
        <div className="relative px-4 pt-4">
          <div className="h-1 overflow-hidden rounded-full bg-white/35">
            <div className="h-full w-2/3 rounded-full bg-white" />
          </div>
          <div className="mt-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center overflow-hidden rounded-full border border-white/40">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated synthetic preview media */}
                <img
                  loading="lazy"
                  decoding="async"
                  alt=""
                  className="size-full object-cover"
                  src="/preview/nastya-profile.jpg"
                />
              </span>
              <span>
                <b className="block text-[11px]">Настя</b>
                <small className="flex items-center gap-1 text-[9px] text-white/75">
                  <MapPin className="size-3" /> Будённовск · Музыка
                </small>
              </span>
            </div>
            <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-black">
              •••
            </span>
          </div>
        </div>
        <div className="relative mt-auto px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#ff3f79] px-1.5 py-0.5 text-[8px] font-black">
            НОВАЯ STORY
          </span>
          <h1 className="mt-3 text-2xl font-black leading-[0.9] tracking-[-0.07em]">
            ВЕЧЕР В ГОРОДЕ
            <br />
            НАЧИНАЕТСЯ.
          </h1>
          <p className="text-white/82 mt-3 max-w-64 text-[11px] leading-5">
            Показываю новую работу и собираю идеи для бьюти-встречи.
          </p>
        </div>
      </section>
      <section className="p-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
          <span className="grid size-8 place-items-center rounded-lg bg-[#f0e4ff]/15 text-[#d9b7ff]">
            <LocalRoleIcon className="size-4" code="beauty" />
          </span>
          <span className="grow">
            <b className="block text-[10px]">Создаёт в Будённовске</b>
            <small className="block text-[9px] text-white/60">
              Мастер маникюра у ДК · открыть профиль
            </small>
          </span>
          <span className="text-[#d9b7ff]">›</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-[#ff77ba]/40 bg-[#3a1a35] px-3 py-1.5 text-[10px] font-bold text-[#ffc0da]">
            <Heart className="size-4" /> Нравится 18
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-[#ded6e5]">
            <Flame className="size-4" /> Огонь 7
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-[#ded6e5]">
            <Sparkles className="size-4" /> Вау
          </button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {["heart", "fire", "party", "diamond"].map((code) => (
            <button
              className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-2"
              key={code}
            >
              <BrandGiftIcon className="size-6 text-[#ffc0da]" code={code} />
              <span className="mt-1 text-[8px] text-white/65">Подарок</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#ff9bc5]">
          <span>В Будённовске сейчас</span>
          <span>Смотреть город ›</span>
        </div>
      </section>
    </div>
  );
}

function OnboardingScreen() {
  return (
    <div className="min-h-[730px] bg-[#fbf9fe] px-4 pb-5 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Mark />
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Первый вход
          </small>
          <b className="mt-0.5 block text-sm">Соберём твой круг</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-xs font-black text-[#7549d0]">
          1/3
        </span>
      </header>
      <div className="mt-5 flex gap-1.5">
        <span className="h-1.5 grow rounded-full bg-[#8254ed]" />
        <span className="h-1.5 grow rounded-full bg-[#e8e1ed]" />
        <span className="h-1.5 grow rounded-full bg-[#e8e1ed]" />
      </div>
      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <MapPin className="size-3.5" /> Твоя точка входа
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ЗДЕСЬ НАЧИНАЕТСЯ
          <br />
          ТВОЙ ГОРОД.
        </h1>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Выбери город, чтобы видеть своих людей, места, эфиры и события. Его можно
          изменить.
        </p>
      </section>
      <section className="border-[#2c2036]/9 mt-5 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-xs">Твой город</b>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3">
          <MapPin className="size-4 text-[#8753e6]" />
          <span className="grow text-[11px] font-bold text-[#5f5269]">Будённовск</span>
          <ChevronRightPreview />
        </div>
        <p className="mt-3 flex gap-2 rounded-xl bg-[#f8f5fb] p-2.5 text-[9px] leading-4 text-[#756a7d]">
          <Check className="mt-0.5 size-3.5 shrink-0 text-[#8753e6]" /> Город нужен,
          чтобы ты видел(а) свою сцену. Переключатель ниже — только для других.
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#fbf9fe] p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <MapPin className="size-4" />
          </span>
          <span className="grow">
            <b className="block text-[10px]">Показывать мой город</b>
            <small className="block text-[9px] leading-4 text-[#81748a]">
              Точный адрес и геолокация не показываются.
            </small>
          </span>
          <span className="flex h-5 w-9 rounded-full bg-[#7c55dc] p-0.5">
            <span className="block size-4 translate-x-4 rounded-full bg-white" />
          </span>
        </div>
      </section>
      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]">
        Продолжить <ChevronRight className="size-4" />
      </button>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[9px] leading-4 text-[#81748a]">
        <LockKeyholePreview /> Настройки приватности будут на следующем шаге.
      </p>
    </div>
  );
}

function LockKeyholePreview() {
  return <Check className="size-3.5 text-[#8753e6]" />;
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
    city: <CityScreen />,
    events: <EventsScreen />,
    local: <LocalScreen />,
    profile: <ProfileScreen />,
    earnings: <EarningsScreen />,
    bonuses: <BonusesScreen />,
    messages: <MessagesScreen />,
    live: <LiveScreen />,
    story: <StoryScreen />,
    onboarding: <OnboardingScreen />,
    rankings: <RankingsScreen />,
    people: <PeopleScreen />,
    settings: <SettingsScreen />,
    wishes: <WishesScreen />,
    collectibles: <CollectiblesScreen />,
    collection: <CollectionScreen />,
    unboxing: <UnboxingScreen />,
    wish: <WishScreen />,
    fundraiser: <FundraiserScreen />,
    "fundraiser-new": <NewFundraiserScreen />,
    "story-new": <NewStoryScreen />,
    "place-new": <NewPlaceScreen />,
    search: <SearchScreen />,
    "wish-new": <NewWishScreen />,
    shop: <ShopScreen />,
    battle: <BattleScreen />,
    "live-analytics": <LiveAnalyticsScreen />,
    "profile-media": <ProfileMediaScreen />,
    "story-analytics": <StoryAnalyticsScreen />,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_8%_5%,#f6d9eb,transparent_26rem),radial-gradient(circle_at_92%_10%,#dfd2ff,transparent_28rem),#f6f4f8] px-4 py-5 text-[#251d31] sm:px-8 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[230px_430px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-[0_18px_50px_rgba(76,48,104,.12)] backdrop-blur lg:sticky lg:top-8">
          <Link
            className="flex items-center gap-2.5 text-lg font-black tracking-[-0.08em]"
            href="/"
          >
            <Mark />
            ХОЧУ ТАКЖЕ
          </Link>
          <p className="border-[#2c2036]/8 mt-6 border-t pt-4 text-[10px] leading-5 text-[#776c80]">
            Просмотр дизайна на синтетических данных — без доступа к аккаунтам и личным
            сообщениям.
          </p>
          <nav
            className="mt-5 grid grid-cols-2 gap-1.5 lg:grid-cols-1"
            aria-label="Экраны preview"
          >
            {screens.map((item) => (
              <a
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black transition ${screen === item.id ? "bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_6px_14px_rgba(160,75,213,.2)]" : "bg-[#f7f3fa] text-[#5f5369] hover:bg-[#f0e7ff]"}`}
                href={`/preview?screen=${item.id}`}
                key={item.id}
              >
                <span
                  className={`grid size-5 place-items-center rounded-md text-[9px] ${screen === item.id ? "bg-white/20" : "bg-white text-[#8753e6]"}`}
                >
                  {item.number}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <section className="w-full max-w-[430px] justify-self-center overflow-hidden rounded-[30px] border border-white/90 bg-[#fbf9fe] shadow-[0_28px_70px_rgba(72,43,104,.2)]">
          <div className="border-[#2c2036]/8 flex items-center justify-between border-b bg-white/70 px-5 py-2 text-[8px] font-bold tracking-[0.12em] text-[#81748a]">
            <span>PREVIEW / NO AUTH</span>
            <span>
              {screens.find((item) => item.id === screen)?.number} —{" "}
              {screens.find((item) => item.id === screen)?.label}
            </span>
          </div>
          {content[screen]}
        </section>
        <section className="hidden rounded-[28px] border border-white/80 bg-white/65 p-7 shadow-[0_18px_50px_rgba(76,48,104,.1)] backdrop-blur lg:block">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8753e6]">
            Premium social direction
          </p>
          <h1 className="mt-4 text-4xl font-black leading-[0.9] tracking-[-0.08em]">
            СВОИ ЛЮДИ.
            <br />
            СВОЙ ГОРОД.
          </h1>
          <p className="mt-6 text-sm leading-6 text-[#6a5e73]">
            Не игровой интерфейс и не бесконечная лента. Качественная мягкая
            social-среда: люди, медиа, действия и настоящее ощущение, что здесь тебя
            ждут.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
            href="/"
          >
            На публичную главную <ArrowUpRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
