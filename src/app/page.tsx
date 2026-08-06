import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CirclePlay,
  Heart,
  MapPin,
  MessageCircle,
  Radio,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { APP_NAME } from "@/lib/constants";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Хочу также — желания ведут к людям",
  description:
    "Социальная платформа желаний, людей, мест и эфиров. Открываем Будённовск вместе.",
};

export const dynamic = "force-dynamic";

type CreatorPreview = {
  username: string;
  display_name: string;
  creator_headline: string | null;
};

type LiveRoomPreview = {
  id: string;
  slug: string;
  title: string;
  hostName: string;
  viewers: number;
};

const creatorColors = [
  "from-[#ff4f87] via-[#ff7b5c] to-[#ffd36a]",
  "from-[#7d55ff] via-[#d65dff] to-[#ff88bf]",
  "from-[#18c4bf] via-[#4d9eff] to-[#9667ff]",
  "from-[#ffc14f] via-[#ff7277] to-[#da55ff]",
];

export default async function SeoLandingPage() {
  let creators: CreatorPreview[] = [];
  let liveRooms: LiveRoomPreview[] = [];

  if (hasSupabaseEnvironment()) {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (user) redirect("/feed");
  }

  if (hasSupabaseEnvironment()) {
    try {
      const supabase = await createClient();
      const [{ data: creatorData }, { data: roomData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, display_name, creator_headline")
          .eq("is_creator", true)
          .eq("profile_visibility", "public")
          .eq("is_suspended", false)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("live_rooms")
          .select("id, slug, title, host_id")
          .eq("status", "live")
          .eq("visibility", "public")
          .order("started_at", { ascending: false })
          .limit(3),
      ]);
      creators = (creatorData ?? []) as CreatorPreview[];
      const rooms = (roomData ?? []) as Array<{
        id: string;
        slug: string;
        title: string;
        host_id: string;
      }>;

      if (rooms.length > 0) {
        const hostIds = [...new Set(rooms.map((room) => room.host_id))];
        const [{ data: hostProfiles }, { data: participants }] = await Promise.all([
          supabase.from("profiles").select("id, display_name").in("id", hostIds),
          supabase
            .from("live_room_participants")
            .select("room_id")
            .in(
              "room_id",
              rooms.map((room) => room.id),
            )
            .is("left_at", null),
        ]);
        const hostById = new Map(
          (hostProfiles ?? []).map((profile) => [profile.id, profile]),
        );
        const viewerCount = new Map<string, number>();
        for (const participant of participants ?? []) {
          viewerCount.set(
            participant.room_id,
            (viewerCount.get(participant.room_id) ?? 0) + 1,
          );
        }
        liveRooms = rooms.flatMap((room) => {
          const host = hostById.get(room.host_id);
          return host
            ? [
                {
                  id: room.id,
                  slug: room.slug,
                  title: room.title,
                  hostName: host.display_name,
                  viewers: viewerCount.get(room.id) ?? 1,
                },
              ]
            : [];
        });
      }
    } catch {
      creators = [];
      liveRooms = [];
    }
  }

  return (
    <main className="relative isolate overflow-hidden bg-[#09090d] text-white selection:bg-[#ff4b8a] selection:text-white">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: APP_NAME,
            description:
              "Социальная платформа желаний, людей, мест и авторских историй.",
            url: process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru",
          }),
        }}
        type="application/ld+json"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-72 -top-72 size-[46rem] rounded-full bg-[#813cff]/20 blur-[130px]" />
        <div className="absolute right-[-18rem] top-36 size-[42rem] rounded-full bg-[#ff416f]/20 blur-[140px]" />
        <div className="absolute left-[30%] top-[65rem] size-[44rem] rounded-full bg-[#176fda]/10 blur-[150px]" />
        <div className="landing-noise absolute inset-0 opacity-40" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <Link
          className="group flex items-center gap-2.5"
          href="/"
          aria-label="Хочу также — главная"
        >
          <span className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[#f5f2ed] text-xl font-black text-[#0a0a0d] transition-transform duration-300 group-hover:-rotate-6">
            <span className="relative z-10">Х</span>
            <span className="absolute -bottom-3 -right-2 size-7 rounded-full bg-[#ff4b8a]" />
          </span>
          <span className="text-[17px] font-black tracking-[-0.06em] sm:text-lg">
            {APP_NAME}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm font-bold text-white/55 md:flex"
          aria-label="Основная навигация"
        >
          <a className="transition hover:text-white" href="#inside">
            Зачем здесь быть
          </a>
          <a className="transition hover:text-white" href="#budennovsk">
            Будённовск
          </a>
          <a className="transition hover:text-white" href="#first-wave">
            Первая волна
          </a>
        </nav>

        <Link
          className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold transition hover:border-white/30 hover:bg-white hover:text-[#101014] sm:px-5"
          href="/auth/sign-in"
        >
          Войти
        </Link>
      </header>

      <section className="relative mx-auto grid min-h-[680px] max-w-[1440px] items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,0.96fr)] lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ffb5d0]">
            <span className="size-1.5 rounded-full bg-[#ff4b8a] shadow-[0_0_12px_#ff4b8a]" />
            Будённовск · первая волна
          </p>
          <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3.4rem,8.2vw,8.4rem)] font-black leading-[0.83] tracking-[-0.082em]">
            Не листай
            <span className="block text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.72)]">
              чужую жизнь.
            </span>
            <span className="block bg-gradient-to-r from-[#ff5b8d] via-[#df63ff] to-[#8e81ff] bg-clip-text text-transparent">
              Собери свою.
            </span>
          </h1>
          <div className="mt-8 grid max-w-2xl gap-5 sm:grid-cols-[1.1fr_0.9fr] sm:items-end">
            <p className="text-white/64 text-pretty text-lg leading-7 sm:text-xl sm:leading-8">
              <b className="font-bold text-white">Хочу также</b> — место, где желание
              становится поводом встретиться, рассказать о себе, найти своих и сделать
              что-то вместе.
            </p>
            <p className="text-white/44 border-l border-[#ff4b8a]/70 pl-4 text-sm leading-6">
              Не ещё одна витрина. Социальная среда, которую создают люди, а не
              рекламные кабинеты.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#f6f2ed] px-6 text-sm font-black text-[#111116] transition hover:-translate-y-0.5 hover:bg-[#ffdfeb] sm:h-14 sm:px-7"
              href="/auth/sign-in"
            >
              Войти в первую волну
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              className="inline-flex h-14 items-center gap-2 rounded-full px-4 text-sm font-bold text-white/65 transition hover:text-white"
              href="#inside"
            >
              Посмотреть, что внутри <ArrowDownRight className="size-4" />
            </a>
          </div>
        </div>

        <div
          className="relative mx-auto mt-1 w-full max-w-[320px] sm:max-w-[420px] lg:mt-0 lg:max-w-[580px]"
          aria-label="Визуальная схема платформы"
        >
          <div className="absolute -left-8 top-16 size-52 rounded-full border border-[#ff638f]/20" />
          <div className="absolute -right-10 bottom-7 size-72 rounded-full border border-[#8e7bff]/15" />
          <div className="relative aspect-[0.95]">
            <div className="absolute inset-x-[8%] inset-y-[3%] rotate-[7deg] rounded-[3rem] border border-white/10 bg-white/[0.035] shadow-[0_40px_100px_rgba(0,0,0,0.38)] backdrop-blur-md" />
            <div className="absolute inset-x-[7%] inset-y-[6%] -rotate-[5deg] rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#1f1830]/90 to-[#101017]/80" />
            <div className="absolute inset-x-[13%] inset-y-[10%] overflow-hidden rounded-[2.6rem] border border-white/15 bg-[#111117] shadow-[0_35px_90px_rgba(0,0,0,0.55)]">
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#ff4b8a]/55 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-[#7448ff]/45 blur-3xl" />
              <div className="relative flex h-full flex-col p-6">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                  <span>Хочу также</span>
                  <span className="rounded-full border border-white/15 px-2 py-1 text-[8px] text-white/75">
                    Город 01
                  </span>
                </div>
                <div className="mt-9">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffacc7]">
                    из желания — в жизнь
                  </p>
                  <p className="mt-2 max-w-sm text-4xl font-black leading-[0.88] tracking-[-0.07em]">
                    Люди не фон.
                    <br />
                    Люди — сюжет.
                  </p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3">
                  <div className="rounded-[1.35rem] border border-white/10 bg-[#fbf5ef] p-4 text-[#151218] shadow-xl">
                    <span className="grid size-8 place-items-center rounded-full bg-[#ff4b8a] text-xs font-black text-white">
                      01
                    </span>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.12em] text-[#7c5967]">
                      Желание
                    </p>
                    <p className="mt-1 text-sm font-black leading-4">
                      Сказать, чего ты хочешь
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.11] p-4 backdrop-blur">
                    <span className="grid size-8 place-items-center rounded-full bg-[#7f5cff] text-xs font-black text-white">
                      02
                    </span>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                      Люди
                    </p>
                    <p className="mt-1 text-sm font-black leading-4">
                      Найти тех, кому тоже важно
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[1.15rem] border border-white/10 bg-black/20 px-4 py-3">
                  <span className="text-xs font-bold text-white/75">
                    Место · разговор · действие
                  </span>
                  <ArrowDownRight className="size-4 text-[#ff9cc1]" />
                </div>
              </div>
            </div>
            <div className="absolute -left-4 bottom-14 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#16131d]/85 px-3.5 py-3 shadow-2xl backdrop-blur-xl">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#ff8366] to-[#da4cff] text-xs font-black">
                ♡
              </span>
              <span>
                <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
                  не прячься
                </span>
                <span className="block text-xs font-bold">
                  у твоего желания есть голос
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative border-y border-white/10 bg-[#f3eee8] py-4 text-[#111116]"
        aria-label="Направления платформы"
      >
        <div className="landing-track flex min-w-max items-center gap-7 whitespace-nowrap text-xl font-black tracking-[-0.055em] sm:text-2xl">
          {[
            "ЖЕЛАНИЯ",
            "ЛЮДИ",
            "МЕСТА",
            "ИСТОРИИ",
            "ЭФИРЫ",
            "ПОДДЕРЖКА",
            "АВТОРЫ",
            "ЖЕЛАНИЯ",
            "ЛЮДИ",
            "МЕСТА",
            "ИСТОРИИ",
            "ЭФИРЫ",
            "ПОДДЕРЖКА",
            "АВТОРЫ",
          ].map((item, index) => (
            <span className="flex items-center gap-7" key={`${item}-${index}`}>
              {item}
              <span className="size-2.5 rounded-full bg-[#ff4b8a]" />
            </span>
          ))}
        </div>
      </section>

      <section
        className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
        id="inside"
      >
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff9dc0]">
              Не ради шума
            </p>
            <h2 className="mt-4 max-w-md text-balance text-5xl font-black leading-[0.89] tracking-[-0.07em] sm:text-6xl">
              Здесь есть, что начать.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/55 sm:text-xl">
            Платформа не подменяет реальную жизнь бесконечной лентой. Она даёт повод
            проявиться: с целью, интересом, эфиром, встречей или своей маленькой
            тусовкой.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <article className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#e9e1d7] p-6 text-[#151218] sm:p-8 lg:col-span-7 lg:min-h-[390px]">
            <div className="absolute -right-16 -top-12 size-72 rounded-full bg-[#ff5b8d] opacity-90 blur-[1px] transition duration-500 group-hover:scale-110" />
            <div className="absolute bottom-[-8rem] right-20 size-80 rounded-full border-[40px] border-[#7e56ff]/30" />
            <div className="relative flex h-full flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]">
                <Heart className="size-3.5 fill-[#ff4b8a] text-[#ff4b8a]" />
                Желание — это начало
              </span>
              <h3 className="mt-7 max-w-lg text-balance text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                Скажи вслух, чего хочешь. Так тебя легче найти.
              </h3>
              <p className="text-black/62 mt-5 max-w-md text-base leading-7">
                Желание — не ценник и не отчёт. Это живая точка, вокруг которой
                появляются поддержка, диалог и похожие люди.
              </p>
              <Link
                className="mt-auto inline-flex w-fit items-center gap-2 pt-10 text-sm font-black transition group-hover:gap-3"
                href="/auth/sign-in"
              >
                Рассказать о своём <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1a1731] p-6 sm:p-8 lg:col-span-5 lg:min-h-[390px]">
            <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-[#6955ff]/45 blur-2xl" />
            <MapPin
              className="absolute right-8 top-8 size-16 text-[#ff79b0]/80"
              strokeWidth={1.2}
            />
            <div className="relative flex h-full flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#bbadff]">
                Город — не настройка профиля
              </p>
              <h3 className="mt-5 max-w-sm text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                Город — это «куда пойдём?»
              </h3>
              <p className="text-white/58 mt-5 max-w-sm text-base leading-7">
                Свои места, люди, разговоры и поводы встретиться. Начинаем с Будённовска
                — честно, с нуля и вместе.
              </p>
              <a
                className="mt-auto inline-flex w-fit items-center gap-2 pt-10 text-sm font-black text-[#f5dff0] transition hover:gap-3"
                href="#budennovsk"
              >
                Открыть первый город <ArrowDownRight className="size-4" />
              </a>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111218] p-6 sm:p-8 lg:col-span-4 lg:min-h-[310px]">
            <div className="absolute -right-10 top-0 size-48 rounded-full bg-[#ffd06d]/25 blur-3xl" />
            <CirclePlay className="size-9 text-[#ffd06d]" strokeWidth={1.5} />
            <h3 className="mt-8 text-3xl font-black leading-[0.93] tracking-[-0.06em]">
              Покажи себя в движении.
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
              Stories, посты и эфиры — чтобы не остаться аватаркой в чужом списке.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#ff4d82] via-[#b954e9] to-[#6954eb] p-6 sm:p-8 lg:col-span-4 lg:min-h-[310px]">
            <MessageCircle className="size-9 text-white/90" strokeWidth={1.5} />
            <h3 className="mt-8 text-3xl font-black leading-[0.93] tracking-[-0.06em]">
              Не набирай аудиторию. Собирай своих.
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
              Здесь реакция может стать разговором, а разговор — новой общей историей.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#d9f3f0] p-6 text-[#0d2628] sm:p-8 lg:col-span-4 lg:min-h-[310px]">
            <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[28px] border-[#36bbb3]/30" />
            <UsersRound className="size-9 text-[#158c87]" strokeWidth={1.5} />
            <h3 className="mt-8 max-w-xs text-3xl font-black leading-[0.93] tracking-[-0.06em]">
              Собери своё место на карте.
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#0d2628]/65">
              Тусовка начинается не с вывески. С пары людей, которым есть что обсудить.
            </p>
          </article>
        </div>
      </section>

      <section
        className="relative border-y border-white/10 bg-[#111117]"
        id="budennovsk"
      >
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:px-12 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff9dc0]">
              <MapPin className="size-4" /> Город 01 · Будённовск
            </p>
            <h2 className="mt-6 max-w-3xl text-balance text-5xl font-black leading-[0.87] tracking-[-0.075em] sm:text-7xl">
              Открываем город, а не изображаем толпу.
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-8 text-white/60 sm:text-xl">
              Первый город ещё не наполнен. Поэтому мы не рисуем чужие сторис, не ставим
              липовые счётчики и не зовём тебя быть «первым в пустоте». Мы собираем
              стартовый круг людей, которым важно сделать Будённовск живым.
            </p>
            <Link
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-[#ff4b8a] px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5 hover:bg-[#ff77a7]"
              href="/auth/sign-in"
            >
              Стать частью первой волны
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                number: "01",
                title: "Заявить о себе",
                text: "Профиль, желание, интересы — без необходимости играть чужую роль.",
              },
              {
                number: "02",
                title: "Собрать своих",
                text: "Авторы, организаторы, инициативные жители и те, кто просто хочет общения.",
              },
              {
                number: "03",
                title: "Запустить ритм",
                text: "Свои места, первые события, stories и эфиры — когда появляются реальные люди.",
              },
            ].map((step) => (
              <div
                className="group flex gap-5 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-[#ff76a8]/50 hover:bg-white/[0.06] sm:block lg:flex"
                key={step.number}
              >
                <span className="shrink-0 text-4xl font-black leading-none tracking-[-0.08em] text-[#ff709f] sm:block lg:text-5xl">
                  {step.number}
                </span>
                <div className="sm:mt-6 lg:mt-0">
                  <h3 className="text-lg font-black tracking-[-0.03em]">
                    {step.title}
                  </h3>
                  <p className="text-white/52 mt-2 text-sm leading-6">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(creators.length > 0 || liveRooms.length > 0) && (
        <section
          className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-28"
          id="first-wave"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff9dc0]">
                Настоящие люди
              </p>
              <h2 className="mt-4 text-balance text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                Первые голоса уже звучат.
              </h2>
            </div>
            <p className="text-white/48 max-w-sm text-sm leading-6">
              Этот блок появляется только из открытых профилей и активных эфиров
              платформы.
            </p>
          </div>

          {creators.length > 0 && (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator, index) => (
                <Link
                  className="group relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.07]"
                  href={`/u/${creator.username}`}
                  key={creator.username}
                >
                  <div
                    className={`absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl ${creatorColors[index % creatorColors.length]}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-lg font-black ${creatorColors[index % creatorColors.length]}`}
                    >
                      {creator.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <ArrowDownRight className="size-5 text-white/45 transition-transform group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-white" />
                  </div>
                  <div className="relative mt-8">
                    <p className="text-xl font-black tracking-[-0.04em]">
                      {creator.display_name}
                    </p>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/55">
                      {creator.creator_headline ?? "Автор в «Хочу также»"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {liveRooms.length > 0 && (
            <div className="mt-12">
              <div className="mb-5 flex items-center gap-2 text-sm font-black">
                <Radio className="size-4 text-[#ff5a8d]" /> Сейчас в эфире
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {liveRooms.map((room) => (
                  <Link
                    className="group rounded-[1.5rem] border border-[#ff6d9f]/25 bg-gradient-to-br from-[#32142a] to-[#17141e] p-5 transition hover:border-[#ff8eb5]/70"
                    href={`/live/${room.slug}`}
                    key={room.id}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff315c] px-2.5 py-1 text-[10px] font-black tracking-[0.12em]">
                      <span className="size-1.5 animate-pulse rounded-full bg-white" />{" "}
                      LIVE
                    </span>
                    <p className="mt-9 truncate text-lg font-black tracking-[-0.035em]">
                      {room.title}
                    </p>
                    <p className="mt-2 flex items-center justify-between text-sm text-white/55">
                      <span className="truncate">{room.hostName}</span>
                      <span className="ml-3 inline-flex shrink-0 items-center gap-1.5">
                        <UsersRound className="size-4" /> {room.viewers}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="relative overflow-hidden border-t border-white/10 bg-[#f3eee8] px-5 py-20 text-[#111116] sm:px-8 lg:px-12 lg:py-28">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-48 size-[34rem] rounded-full bg-[#ff6c9b]/55 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-64 left-[38%] size-[38rem] rounded-full bg-[#735bff]/35 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1100px] text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b93162]">
            Это только начинается
          </p>
          <h2 className="mt-6 text-balance text-[clamp(3.4rem,8vw,7.3rem)] font-black leading-[0.82] tracking-[-0.09em]">
            Твоё «хочу»
            <span className="block text-[#ff427c]">может стать общим.</span>
          </h2>
          <p className="text-black/62 mx-auto mt-8 max-w-xl text-lg leading-8 sm:text-xl">
            Войди в первую волну «Хочу также» и помоги открыть первый живой город — без
            декораций, по-настоящему.
          </p>
          <Link
            className="h-15 group mt-10 inline-flex items-center gap-3 rounded-full bg-[#111116] px-7 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#33273a]"
            href="/auth/sign-in"
          >
            Присоединиться к первой волне
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#09090d] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 text-xs font-bold text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a className="transition hover:text-white" href="#inside">
              Платформа
            </a>
            <a className="transition hover:text-white" href="#budennovsk">
              Первый город
            </a>
            <Link className="transition hover:text-white" href="/auth/sign-in">
              Войти
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
