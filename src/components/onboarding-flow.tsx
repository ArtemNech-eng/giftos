"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import { completeOnboarding } from "@/app/onboarding/actions";
import { CATEGORIES } from "@/lib/constants";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

type InitialProfile = {
  username: string;
  displayName: string;
  bio: string;
  city: string;
  showCity: boolean;
  profileVisibility: "public" | "private";
  allowDirectMessages: boolean;
};

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
  icon: React.ReactNode;
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

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <CheckCircle2 className="size-4.5" />
      {pending ? "Собираем твой круг…" : "Войти в свой город"}
    </button>
  );
}

export function OnboardingFlow({
  profile,
  cityNames,
  cityHint,
}: {
  profile: InitialProfile;
  cityNames: string[];
  cityHint: string | null;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  const goNext = () => {
    if (step === 2) {
      const name = String(
        document.getElementById("onboarding-name")?.getAttribute("value") ?? "",
      );
      const username = String(
        document.getElementById("onboarding-username")?.getAttribute("value") ?? "",
      );
      // Browser inputs expose the current value as a property, not an attribute.
      const nameInput = document.getElementById(
        "onboarding-name",
      ) as HTMLInputElement | null;
      const usernameInput = document.getElementById(
        "onboarding-username",
      ) as HTMLInputElement | null;
      const displayName = nameInput?.value.trim() || name.trim();
      const normalizedUsername = usernameInput?.value.trim() || username.trim();
      if (!displayName) {
        setError("Напиши имя — так люди поймут, с кем общаются.");
        return;
      }
      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        setError("Username: от 3 до 30 символов, только латиница, цифры и _.");
        return;
      }
      if (interests.length === 0) {
        setError("Выбери хотя бы один интерес — он поможет найти свой круг.");
        return;
      }
    }
    setError(null);
    setStep((current) => Math.min(3, current + 1));
  };

  const toggleInterest = (slug: string) => {
    setInterests((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 8) {
        setError("Можно выбрать до 8 интересов.");
        return current;
      }
      setError(null);
      return [...current, slug];
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#ff5d9a] via-[#dc67db] to-[#7559ec] text-xl font-black text-white shadow-[0_6px_16px_rgba(163,80,207,.28)]">
          ♡
        </span>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Первый вход
          </small>
          <b className="mt-0.5 block text-sm">Соберём твой круг</b>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-xs font-black text-[#7549d0]">
          {step}/3
        </span>
      </header>

      <div
        className="mt-5 flex gap-1.5"
        aria-label={`Шаг ${step} из 3`}
        role="progressbar"
      >
        {[1, 2, 3].map((item) => (
          <span
            className={`h-1.5 grow rounded-full ${item <= step ? "bg-[#8254ed]" : "bg-[#e8e1ed]"}`}
            key={item}
          />
        ))}
      </div>

      <form action={completeOnboarding} className="mt-5">
        <section
          className={
            step === 1
              ? "animate-in fade-in slide-in-from-right-2 duration-300"
              : "hidden"
          }
        >
          <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
            <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
              <MapPin className="size-3.5" /> Твоя точка входа
            </span>
            <h1 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
              Здесь начинается
              <br />
              твой город.
            </h1>
            <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
              Выбери город, чтобы видеть своих людей, места, эфиры и события. Его всегда
              можно изменить.
            </p>
          </div>

          <section className="border-[#2c2036]/9 mt-5 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <label className="block" htmlFor="onboarding-city">
              <span className="text-xs font-black">Твой город</span>
              <input
                className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                defaultValue={profile.city}
                id="onboarding-city"
                list="onboarding-city-options"
                maxLength={100}
                name="city"
                placeholder="Например, Будённовск"
              />
              <datalist id="onboarding-city-options">
                {cityNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
            {cityHint && (
              <p className="mt-2.5 flex gap-2 rounded-xl bg-[#f0faf5] px-3 py-2.5 text-[10px] leading-4 text-[#4c7169]">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#258b82]" />
                {cityHint}
              </p>
            )}
            <p className="mt-3 flex gap-2 rounded-xl bg-[#f8f5fb] px-3 py-2.5 text-[10px] leading-4 text-[#756a7d]">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#8753e6]" />
              Город нужен, чтобы ты видел(а) свою городскую сцену. Переключатель ниже
              решает только, увидят ли тебя другие.
            </p>
            <div className="mt-4">
              <ToggleRow
                checked={profile.showCity}
                description="Тогда тебя можно увидеть среди публичных людей города. Точный адрес и геолокация не показываются."
                icon={<MapPin className="size-4" />}
                name="show_city"
                title="Показывать мой город в профиле"
              />
            </div>
          </section>
        </section>

        <section
          className={
            step === 2
              ? "animate-in fade-in slide-in-from-right-2 duration-300"
              : "hidden"
          }
        >
          <div className="rounded-[1.8rem] bg-gradient-to-br from-[#fff3f8] to-[#eee8ff] p-5 shadow-[0_12px_30px_rgba(69,43,94,.08)]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
              <UserRound className="size-3.5" /> Покажи себя своим
            </span>
            <h1 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
              Не анкета.
              <br />
              Начало истории.
            </h1>
            <p className="max-w-70 mt-3 text-[11px] leading-5 text-[#756a7d]">
              Пара деталей поможет людям узнать тебя и продолжить разговор.
            </p>
          </div>

          <section className="border-[#2c2036]/9 mt-5 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <label className="block" htmlFor="onboarding-name">
                <span className="text-[10px] font-black text-[#65596e]">
                  Как тебя зовут?
                </span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                  defaultValue={profile.displayName}
                  id="onboarding-name"
                  maxLength={80}
                  name="display_name"
                  placeholder="Настя"
                  required
                />
              </label>
              <label className="block" htmlFor="onboarding-avatar">
                <span className="text-[10px] font-black text-[#65596e]">Аватар</span>
                <span className="mt-1.5 grid h-[46px] w-12 place-items-center rounded-xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] text-[#8753e6]">
                  <Camera className="size-4" />
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  id="onboarding-avatar"
                  name="avatar"
                  type="file"
                />
              </label>
            </div>
            <label className="mt-4 block" htmlFor="onboarding-username">
              <span className="text-[10px] font-black text-[#65596e]">Username</span>
              <span className="mt-1.5 flex items-center rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#887a92] focus-within:border-[#b28be8]">
                <span className="text-sm font-bold">@</span>
                <input
                  className="min-w-0 grow bg-transparent py-3 pl-1 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[#aaa0ae]"
                  defaultValue={profile.username}
                  id="onboarding-username"
                  maxLength={30}
                  name="username"
                  pattern="[a-zA-Z0-9_]{3,30}"
                  placeholder="nastya_city"
                  required
                />
              </span>
            </label>
            <label className="mt-4 block" htmlFor="onboarding-bio">
              <span className="text-[10px] font-black text-[#65596e]">
                Пара слов о себе
              </span>
              <textarea
                className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none transition placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                defaultValue={profile.bio}
                id="onboarding-bio"
                maxLength={500}
                name="bio"
                placeholder="Что тебя вдохновляет, чем хочется поделиться?"
              />
            </label>
          </section>

          <section className="border-[#2c2036]/9 mt-4 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
                <Sparkles className="size-4" />
              </span>
              <span>
                <h2 className="text-xs font-black">Что тебе близко?</h2>
                <p className="mt-0.5 text-[10px] text-[#81748a]">
                  Выбери до 8 интересов для своего круга
                </p>
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => {
                const selected = interests.includes(category.slug);
                return (
                  <label className="cursor-pointer" key={category.slug}>
                    <input
                      checked={selected}
                      className="sr-only"
                      name="interests"
                      onChange={() => toggleInterest(category.slug)}
                      type="checkbox"
                      value={category.slug}
                    />
                    <span
                      className={`flex min-h-10 items-center justify-between rounded-xl border px-3 text-[10px] font-bold transition ${
                        selected
                          ? "border-[#a67ae7] bg-[#f0e9ff] text-[#7549d0]"
                          : "border-[#2c2036]/9 bg-[#fbf9fe] text-[#756a7d]"
                      }`}
                    >
                      <span className="truncate">{category.label}</span>
                      <span
                        className={`ml-2 size-2 rounded-full ${
                          selected ? "bg-[#7549d0]" : "bg-[#d9d0df]"
                        }`}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </section>

        <section
          className={
            step === 3
              ? "animate-in fade-in slide-in-from-right-2 duration-300"
              : "hidden"
          }
        >
          <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
            <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
              <LockKeyhole className="size-3.5" /> Твои границы
            </span>
            <h1 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
              Открыто ровно
              <br />
              столько, сколько хочешь.
            </h1>
            <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
              Любую настройку можно поменять позже. Ничего личного не попадёт в город
              без твоего выбора.
            </p>
          </div>

          <section className="border-[#2c2036]/9 mt-5 space-y-3 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <label className="block" htmlFor="onboarding-visibility">
              <span className="text-[10px] font-black text-[#65596e]">
                Видимость профиля
              </span>
              <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#65596e]">
                <UsersRound className="size-4 text-[#8753e6]" />
                <select
                  className="min-w-0 grow appearance-none bg-transparent py-3 text-xs font-bold outline-none"
                  defaultValue={profile.profileVisibility}
                  id="onboarding-visibility"
                  name="profile_visibility"
                >
                  <option value="public">
                    Публичный — можно найти в открытых сценах
                  </option>
                  <option value="private">
                    Приватный — скрыт из публичного города
                  </option>
                </select>
              </span>
            </label>
            <ToggleRow
              checked={profile.allowDirectMessages}
              description="Люди смогут начать обычный приватный разговор через сообщения."
              icon={<MessageCircle className="size-4" />}
              name="allow_direct_messages"
              title="Разрешить личные сообщения"
            />
            <ToggleRow
              checked={false}
              description="Публичные вступления и поддержка могут появиться в City Pulse только при согласии всех участников."
              icon={<Sparkles className="size-4" />}
              name="share_city_moments"
              title="Показывать мои публичные моменты"
            />
            <p className="flex gap-2 rounded-xl bg-[#f8f5fb] p-3 text-[10px] leading-4 text-[#756a7d]">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#8753e6]" />
              Личные сообщения, платные запросы и приватные сборы никогда не попадают в
              городскую сцену.
            </p>
          </section>
        </section>

        {error && (
          <p className="mt-4 rounded-xl bg-[#fff0f5] px-3 py-2.5 text-[10px] font-bold text-[#b94d75]">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          {step > 1 && (
            <button
              className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#2c2036]/10 bg-white text-[#685c70]"
              onClick={() => {
                setError(null);
                setStep((current) => current - 1);
              }}
              type="button"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          {step < 3 ? (
            <button
              className="flex grow items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
              onClick={goNext}
              type="button"
            >
              Продолжить <ChevronRight className="size-4" />
            </button>
          ) : (
            <FinishButton />
          )}
        </div>
      </form>
    </main>
  );
}
