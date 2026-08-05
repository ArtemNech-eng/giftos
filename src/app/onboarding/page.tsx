import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { completeOnboarding } from "@/app/onboarding/actions";
import { FieldLabel, inputClassName, textAreaClassName } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { CATEGORIES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создание профиля",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, display_name, bio, city, show_city, profile_visibility, allow_direct_messages, onboarding_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) redirect("/feed");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fce5ec] text-[#d34872]">
          <CheckCircle2 className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-[#bd3e66]">Шаг 1 из 1</p>
        <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight">
          Расскажите немного о себе
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
          Так другим будет проще понять ваши желания, поддержать вас и найти общие
          интересы.
        </p>
      </div>

      <form
        action={completeOnboarding}
        className="surface rounded-2xl p-5 sm:p-8"
        encType="multipart/form-data"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="display_name">Ваше имя</FieldLabel>
            <input
              className={inputClassName}
              defaultValue={profile?.display_name ?? ""}
              id="display_name"
              maxLength={80}
              name="display_name"
              placeholder="Например, Настя"
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#9b858c]">
                @
              </span>
              <input
                className={`${inputClassName} pl-7`}
                defaultValue={profile?.username ?? ""}
                id="username"
                maxLength={30}
                name="username"
                pattern="[a-zA-Z0-9_]{3,30}"
                placeholder="nastya_photo"
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-[#9b858c]">
              От 3 до 30 символов: латиница, цифры и _.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel htmlFor="bio" optional>
            О себе
          </FieldLabel>
          <textarea
            className={textAreaClassName}
            defaultValue={profile?.bio ?? ""}
            id="bio"
            maxLength={500}
            name="bio"
            placeholder="Чем вы увлекаетесь и о чём мечтаете?"
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="city" optional>
              Город
            </FieldLabel>
            <input
              className={inputClassName}
              defaultValue={profile?.city ?? ""}
              id="city"
              maxLength={100}
              name="city"
              placeholder="Казань"
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[#725c63]">
              <input
                defaultChecked={profile?.show_city ?? false}
                name="show_city"
                type="checkbox"
              />
              Показывать город в профиле
            </label>
          </div>
          <div>
            <FieldLabel htmlFor="avatar" optional>
              Аватар
            </FieldLabel>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-[#725c63] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fce5ec] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#bd3e66] hover:file:bg-[#f8d9e4]"
              id="avatar"
              name="avatar"
              type="file"
            />
            <p className="mt-1.5 text-xs text-[#9b858c]">JPG, PNG или WebP, до 5 МБ.</p>
          </div>
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-[#5c464d]">
            Что вам интересно?
          </legend>
          <p className="mt-1 text-sm text-[#8e747c]">
            Выберите хотя бы одну тему — это основа будущих рекомендаций.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((category) => (
              <label
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#f0e2e6] px-3 py-2.5 text-sm text-[#604a52] transition hover:border-[#efafc2] hover:bg-rose-50"
                key={category.slug}
              >
                <input name="interests" type="checkbox" value={category.slug} />
                <span>{category.emoji}</span>
                {category.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7 border-t border-[#f0e2e6] pt-5">
          <legend className="text-sm font-semibold text-[#5c464d]">Приватность</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
              <span className="font-semibold">Профиль</span>
              <select
                className="mt-2 block w-full bg-transparent text-sm outline-none"
                defaultValue={profile?.profile_visibility ?? "public"}
                name="profile_visibility"
              >
                <option value="public">Публичный</option>
                <option value="private">Приватный</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
              <input
                defaultChecked={profile?.allow_direct_messages ?? true}
                name="allow_direct_messages"
                type="checkbox"
              />
              Разрешить личные сообщения
            </label>
          </div>
        </fieldset>

        <div className="mt-7 flex justify-end border-t border-[#f0e2e6] pt-5">
          <SubmitButton pendingLabel="Создаём профиль…">Продолжить</SubmitButton>
        </div>
      </form>
    </main>
  );
}
