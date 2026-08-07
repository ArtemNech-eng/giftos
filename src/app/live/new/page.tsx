import Link from "next/link";
import {
  ArrowLeft,
  EyeOff,
  Link2,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";

import { createLiveRoom } from "@/app/live/actions";
import { CATEGORIES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать эфир",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type PlaceOption = { id: string; name: string };

export default async function NewLivePage() {
  const { supabase, user } = await requireUser();
  const [{ data: wishes }, { data: profile }] = await Promise.all([
    supabase
      .from("wishes")
      .select("id, title")
      .eq("author_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("city_id, city").eq("id", user.id).maybeSingle(),
  ]);
  const { data: rawPlaces } = profile?.city_id
    ? await supabase
        .from("places")
        .select("id, name")
        .eq("city_id", profile.city_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(100)
    : { data: [] };
  const places = (rawPlaces ?? []) as PlaceOption[];

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в кабинет автора"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/creator/dashboard"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская сцена
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новый эфир</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Radio className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Video className="size-3.5" /> Запусти момент
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          Выйди к своим
          <br />в эфир.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
          Эфир может начать разговор в городе, продолжить желание или собрать людей
          вокруг одной темы.
        </p>
      </section>

      <form action={createLiveRoom} className="mt-5 space-y-4">
        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <label className="block" htmlFor="live-title">
            <span className="text-xs font-black">Как называется эфир?</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              id="live-title"
              maxLength={160}
              name="title"
              placeholder="Например, музыка во дворе"
              required
            />
          </label>
          <label className="mt-4 block" htmlFor="live-description">
            <span className="text-[10px] font-black text-[#65596e]">
              Что сейчас будет происходить?
            </span>
            <textarea
              className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              id="live-description"
              maxLength={1000}
              name="description"
              placeholder="Коротко расскажи зрителям, почему стоит зайти прямо сейчас."
            />
          </label>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
              <Sparkles className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Контекст эфира</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Помогает людям понять, куда они заходят
              </p>
            </span>
          </div>
          <label className="mt-4 block" htmlFor="live-category">
            <span className="text-[10px] font-black text-[#65596e]">Категория</span>
            <select
              className="mt-1.5 w-full appearance-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-bold outline-none focus:border-[#b28be8]"
              defaultValue=""
              id="live-category"
              name="category_slug"
            >
              <option value="">Без категории</option>
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block" htmlFor="live-wish">
            <span className="text-[10px] font-black text-[#65596e]">
              Связать с желанием
            </span>
            <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#887a92]">
              <Link2 className="size-4 shrink-0 text-[#8753e6]" />
              <select
                className="min-w-0 grow appearance-none bg-transparent py-3 text-xs font-bold outline-none"
                defaultValue=""
                id="live-wish"
                name="wish_id"
              >
                <option value="">Самостоятельная сцена</option>
                {(wishes ?? []).map((wish) => (
                  <option key={wish.id} value={wish.id}>
                    {wish.title}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="mt-4 block" htmlFor="live-place">
            <span className="text-[10px] font-black text-[#65596e]">
              Место в городе
            </span>
            <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#887a92]">
              <MapPin className="size-4 shrink-0 text-[#258b82]" />
              <select
                className="min-w-0 grow appearance-none bg-transparent py-3 text-xs font-bold outline-none"
                defaultValue=""
                id="live-place"
                name="place_id"
              >
                <option value="">Без привязки к месту</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </span>
            <small className="mt-1.5 block text-[9px] leading-4 text-[#8a7d91]">
              {profile?.city
                ? `Доступны только активные места ${profile.city}. Это контекст комнаты, не точная геолокация.`
                : "Выбери город в профиле, чтобы привязать эфир к месту."}
            </small>
          </label>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#eef2ff] text-[#536cb8]">
              <UsersRound className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Кто сможет смотреть?</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Выбери аудиторию до старта
              </p>
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
              <input
                className="mt-0.5 accent-[#7549d0]"
                defaultChecked
                name="visibility"
                type="radio"
                value="public"
              />
              <span className="grow">
                <b className="block text-[10px]">Публичный</b>
                <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                  Может появиться в городе и у подписчиков.
                </small>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
              <input
                className="mt-0.5 accent-[#7549d0]"
                name="visibility"
                type="radio"
                value="unlisted"
              />
              <span className="grid size-7 place-items-center rounded-lg bg-white text-[#8753e6]">
                <Link2 className="size-3.5" />
              </span>
              <span className="grow">
                <b className="block text-[10px]">По ссылке</b>
                <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                  Не в общей городской сцене.
                </small>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
              <input
                className="mt-0.5 accent-[#7549d0]"
                name="visibility"
                type="radio"
                value="private"
              />
              <span className="grid size-7 place-items-center rounded-lg bg-white text-[#8753e6]">
                <EyeOff className="size-3.5" />
              </span>
              <span className="grow">
                <b className="block text-[10px]">Приватный</b>
                <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                  Скрыт из публичных поверхностей.
                </small>
              </span>
            </label>
          </div>
        </section>

        <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
          <p className="text-[10px] leading-4">
            Комната и чат создаются сейчас. Настоящий видео- и аудиотранспорт появится
            только после настройки self-hosted LiveKit/SFU.
          </p>
        </section>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
          type="submit"
        >
          <Radio className="size-4.5" /> Создать эфир
        </button>
      </form>
    </main>
  );
}
