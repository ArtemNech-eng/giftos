import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldAlert, UserRound } from "lucide-react";

import {
  changePassword,
  deleteAccount,
  updateProfileSettings,
} from "@/app/settings/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Настройки",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, display_name, bio, city, show_city, profile_visibility, allow_direct_messages, share_city_moments",
    )
    .eq("id", user.id)
    .maybeSingle();
  const { data: cities } = await supabase
    .from("cities")
    .select("name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(50);
  const cityNames = (cities ?? []).map((city) => city.name);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/feed"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Настройки</h1>
        <span className="w-9" />
      </header>

      <form action={updateProfileSettings} className="mt-6 space-y-4">
        <div>
          <label
            className="text-sm font-semibold text-[#d8d0e0]"
            htmlFor="display-name"
          >
            Имя
          </label>
          <input
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            defaultValue={profile?.display_name ?? ""}
            id="display-name"
            maxLength={80}
            name="display_name"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]" htmlFor="bio">
            О себе
          </label>
          <textarea
            className="mt-1.5 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            defaultValue={profile?.bio ?? ""}
            id="bio"
            maxLength={500}
            name="bio"
            placeholder="Чем вы увлекаетесь?"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]" htmlFor="city">
            Город
          </label>
          <input
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
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
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            className="accent-[#ff4b8a]"
            defaultChecked={profile?.show_city ?? false}
            name="show_city"
            type="checkbox"
          />
          Показывать город в профиле
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            className="mt-0.5 accent-[#ff4b8a]"
            defaultChecked={profile?.share_city_moments ?? false}
            name="share_city_moments"
            type="checkbox"
          />
          <span>
            <span className="block">Показывать мои публичные моменты в городе</span>
            <span className="mt-0.5 block text-xs leading-5 text-[#a9a1b4]">
              Вступления в тусовки, публичные подарки и поддержка эфира появятся только
              когда все участники разрешили это в настройках.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            className="accent-[#ff4b8a]"
            defaultChecked={profile?.allow_direct_messages ?? true}
            name="allow_direct_messages"
            type="checkbox"
          />
          Разрешить личные сообщения
        </label>
        <div>
          <label
            className="text-sm font-semibold text-[#d8d0e0]"
            htmlFor="profile-visibility"
          >
            Видимость профиля
          </label>
          <select
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            defaultValue={profile?.profile_visibility ?? "public"}
            id="profile-visibility"
            name="profile_visibility"
          >
            <option value="public">Публичный</option>
            <option value="private">Приватный</option>
          </select>
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] py-3 text-sm font-bold"
          type="submit"
        >
          <UserRound className="size-4" /> Сохранить
        </button>
      </form>

      <Link
        className="mt-6 flex items-center justify-between rounded-2xl border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4"
        href="/local"
      >
        <span>
          <span className="block text-sm font-bold text-[#251d31]">
            Создают в городе
          </span>
          <span className="mt-0.5 block text-xs text-[#766b80]">
            Локальная витрина: чем вы занимаетесь и что сейчас показываете
          </span>
        </span>
        <span className="text-[#8753e6]">›</span>
      </Link>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#171923] p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <KeyRound className="size-4 text-[#8df0b4]" /> Пароль
        </p>
        <form action={changePassword} className="mt-3 flex gap-2">
          <input
            className="grow rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            minLength={8}
            name="new_password"
            placeholder="Новый пароль (8+ символов)"
            required
            type="password"
          />
          <button
            className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
            type="submit"
          >
            Сменить
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-[#ff5b99]/30 bg-[#2a1222] p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-[#ff9bc5]">
          <ShieldAlert className="size-4" /> Удалить аккаунт
        </p>
        <p className="mt-1 text-xs leading-5 text-[#b9a0b2]">
          Будет удалён профиль, желания, сообщения и все данные. Действие необратимо.
        </p>
        <form action={deleteAccount} className="mt-3 flex gap-2">
          <input
            className="grow rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            name="confirm"
            placeholder='Введите "УДАЛИТЬ"'
            required
          />
          <button
            className="rounded-xl border border-[#ff5b99]/50 px-4 text-sm font-bold text-[#ff9bc5]"
            type="submit"
          >
            Удалить
          </button>
        </form>
      </section>

      <Link
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href={`/u/${profile?.username ?? ""}`}
      >
        <ArrowLeft className="size-4" /> Мой профиль
      </Link>
    </main>
  );
}
