import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  changePassword,
  deleteAccount,
  updateProfileSettings,
} from "@/app/settings/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Настройки и приватность",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function ToggleRow({
  name,
  checked,
  title,
  description,
  icon,
}: {
  name: string;
  checked: boolean;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fbf9fe] p-3.5 transition hover:bg-[#f7f2fa]">
      <input
        className="peer sr-only"
        defaultChecked={checked}
        name={name}
        type="checkbox"
      />
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
        {icon}
      </span>
      <span className="min-w-0 grow">
        <b className="block text-xs">{title}</b>
        <span className="mt-1 block text-[10px] leading-4 text-[#81748a]">
          {description}
        </span>
      </span>
      <span className="mt-1 flex h-5 w-9 shrink-0 rounded-full bg-[#d7cedf] p-0.5 transition peer-checked:bg-[#7c55dc]">
        <span className="size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(51,33,64,.2)] transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; password?: string }>;
}) {
  const { saved, password } = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: cities }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, display_name, bio, city, city_id, show_city, profile_visibility, allow_direct_messages, share_city_moments",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("cities")
      .select("name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(50),
  ]);
  const cityNames = (cities ?? []).map((city) => city.name);
  const publicProfile = profile?.profile_visibility === "public";
  const cityVisible = Boolean(profile?.city_id && profile.show_city && publicProfile);
  const momentsVisible = Boolean(cityVisible && profile?.share_city_moments);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в профиль"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/feed"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Твой контроль
          </small>
          <h1 className="mt-0.5 text-sm font-black">Настройки</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <ShieldCheck className="size-4.5" />
        </span>
      </header>

      {(saved === "1" || password === "1") && (
        <section className="mt-4 flex items-center gap-2 rounded-2xl border border-[#bde6d4] bg-[#effaf4] px-3.5 py-3 text-[#258b82] shadow-[0_6px_16px_rgba(38,139,130,.08)]">
          <ShieldCheck className="size-4 shrink-0" />
          <p className="text-[11px] font-bold">
            {password === "1" ? "Пароль обновлён." : "Настройки сохранены."}
          </p>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <LockKeyhole className="size-3.5" /> Приватность по умолчанию
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          Ты решаешь,
          <br />
          что видит город.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
          Городская сцена строится только из добровольно открытых публичных действий.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="bg-white/14 rounded-full px-2.5 py-1 text-[9px] font-black">
            {publicProfile ? "Профиль открыт" : "Профиль приватный"}
          </span>
          <span className="bg-white/14 rounded-full px-2.5 py-1 text-[9px] font-black">
            {cityVisible ? "Город виден" : "Город скрыт"}
          </span>
          <span className="bg-white/14 rounded-full px-2.5 py-1 text-[9px] font-black">
            {momentsVisible ? "Моменты включены" : "Моменты выключены"}
          </span>
        </div>
      </section>

      <form action={updateProfileSettings} className="mt-5 space-y-4">
        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
              <UserRound className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Твоя страница</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Как тебя увидят в профиле и городе
              </p>
            </span>
          </div>
          <label className="mt-4 block" htmlFor="display-name">
            <span className="text-[10px] font-black text-[#65596e]">Имя</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              defaultValue={profile?.display_name ?? ""}
              id="display-name"
              maxLength={80}
              name="display_name"
              required
            />
          </label>
          <label className="mt-4 block" htmlFor="bio">
            <span className="text-[10px] font-black text-[#65596e]">О себе</span>
            <textarea
              className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none transition placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              defaultValue={profile?.bio ?? ""}
              id="bio"
              maxLength={500}
              name="bio"
              placeholder="Чем ты живёшь и что хочешь показать своим?"
            />
          </label>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
              <MapPin className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Твой город</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Нужен для людей, мест и городской программы
              </p>
            </span>
          </div>
          <label className="mt-4 block" htmlFor="city">
            <span className="text-[10px] font-black text-[#65596e]">Город</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              defaultValue={profile?.city ?? ""}
              id="city"
              list="city-options"
              maxLength={100}
              name="city"
              placeholder="Будённовск"
            />
            <datalist id="city-options">
              {cityNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <div className="mt-3">
            <ToggleRow
              checked={profile?.show_city ?? false}
              description="Тогда тебя можно увидеть среди публичных людей твоего города. Точный адрес и геолокация не показываются."
              icon={<MapPin className="size-4" />}
              name="show_city"
              title="Показывать город в профиле"
            />
          </div>
          <p
            className={`mt-3 rounded-xl px-3 py-2.5 text-[10px] leading-4 ${
              cityVisible
                ? "bg-[#f0faf5] text-[#4c7169]"
                : "bg-[#fff7e8] text-[#896a27]"
            }`}
          >
            {cityVisible
              ? "Ты уже доступен(на) в публичных городских сценах: люди, рейтинги, места и события."
              : "Для городских сцен нужны выбранный город, публичный профиль и это разрешение."}
          </p>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
              <Sparkles className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Публичные моменты</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Только те действия, которыми ты хочешь поделиться
              </p>
            </span>
          </div>
          <div className="mt-4">
            <ToggleRow
              checked={profile?.share_city_moments ?? false}
              description="Вступление в место и публичная поддержка story или эфира могут попасть в City Pulse только при согласии всех участников."
              icon={<Sparkles className="size-4" />}
              name="share_city_moments"
              title="Показывать мои моменты в городе"
            />
          </div>
          <p className="mt-3 flex gap-2 rounded-xl bg-[#f8f5fb] px-3 py-2.5 text-[10px] leading-4 text-[#756a7d]">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#8753e6]" />
            Личные сообщения, платные запросы, приватные сборы и поддержка без согласия
            никогда не становятся моментами города.
          </p>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#eef2ff] text-[#536cb8]">
              <LockKeyhole className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Личное пространство</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Кто видит страницу и может начать разговор
              </p>
            </span>
          </div>
          <label className="mt-4 block" htmlFor="profile-visibility">
            <span className="text-[10px] font-black text-[#65596e]">
              Видимость профиля
            </span>
            <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#65596e]">
              {publicProfile ? (
                <Eye className="size-4 text-[#8753e6]" />
              ) : (
                <EyeOff className="size-4 text-[#8753e6]" />
              )}
              <select
                className="min-w-0 grow appearance-none bg-transparent py-3 text-xs font-bold outline-none"
                defaultValue={profile?.profile_visibility ?? "public"}
                id="profile-visibility"
                name="profile_visibility"
              >
                <option value="public">Публичный — виден в открытых сценах</option>
                <option value="private">Приватный — скрыт из публичного города</option>
              </select>
            </span>
          </label>
          <div className="mt-3">
            <ToggleRow
              checked={profile?.allow_direct_messages ?? true}
              description="Люди смогут начать личный разговор только через обычный приватный диалог."
              icon={<MessageCircle className="size-4" />}
              name="allow_direct_messages"
              title="Разрешить личные сообщения"
            />
          </div>
        </section>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
          type="submit"
        >
          <ShieldCheck className="size-4.5" /> Сохранить настройки
        </button>
      </form>

      <Link
        className="mt-5 flex items-center gap-3 rounded-[1.5rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
        href="/local"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-white text-[#8753e6] shadow-[0_4px_12px_rgba(80,45,110,.08)]">
          <UsersRound className="size-5" />
        </span>
        <span className="min-w-0 grow">
          <b className="block text-xs">Создают в городе</b>
          <span className="mt-1 block text-[10px] leading-4 text-[#756a7d]">
            Настрой локальную витрину: кем тебя знают и что ты сейчас показываешь.
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#8753e6]" />
      </Link>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#f0faf5] text-[#258b82]">
            <KeyRound className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Пароль</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Обновляй доступ отдельно от профиля
            </p>
          </span>
        </div>
        <form action={changePassword} className="mt-4 flex gap-2">
          <input
            className="min-w-0 grow rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-medium outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
            minLength={8}
            name="new_password"
            placeholder="Новый пароль — минимум 8 символов"
            required
            type="password"
          />
          <button
            className="shrink-0 rounded-xl bg-[#f0e9ff] px-3 text-[10px] font-black text-[#7549d0]"
            type="submit"
          >
            Сменить
          </button>
        </form>
      </section>

      <section className="mt-5 rounded-[1.6rem] border border-[#f1c9d8] bg-[#fff5f8] p-4">
        <div className="flex items-center gap-2 text-[#a44d71]">
          <ShieldAlert className="size-4" />
          <h2 className="text-xs font-black">Удалить аккаунт</h2>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#8c6676]">
          Будут удалены профиль, желания, сообщения и связанные данные. Это действие
          нельзя отменить.
        </p>
        <form action={deleteAccount} className="mt-3 flex gap-2">
          <input
            className="min-w-0 grow rounded-xl border border-[#eec4d4] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#b895a2] focus:border-[#dc7e9f]"
            name="confirm"
            placeholder="Введите УДАЛИТЬ"
            required
          />
          <button
            className="shrink-0 rounded-xl border border-[#e38dad] px-3 text-[10px] font-black text-[#b44d72]"
            type="submit"
          >
            Удалить
          </button>
        </form>
      </section>

      <Link
        className="mt-6 flex items-center justify-center gap-2 text-[11px] font-black text-[#8753e6]"
        href={`/u/${profile?.username ?? ""}`}
      >
        <UserRound className="size-4" /> Открыть мой профиль
      </Link>
    </main>
  );
}
