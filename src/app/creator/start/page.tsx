import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { activateCreatorPage } from "@/app/creator/start/actions";
import { FieldLabel, inputClassName, textAreaClassName } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать страницу автора",
  robots: { index: false, follow: false },
};

export default async function CreatorStartPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, creator_headline, is_creator")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#a13d5e]"
        href="/"
      >
        <ArrowLeft className="size-4" /> К ленте
      </Link>
      <div className="mb-7 mt-6">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fce5ec] text-[#d34872]">
          <Sparkles className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-[#bd3e66]">Хочу также</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Создайте страницу автора
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
          Расскажите, чем вы интересуетесь, что делаете и почему на вашу страницу стоит
          подписаться. Платные функции и эфиры будут подключаться постепенно.
        </p>
      </div>
      <form action={activateCreatorPage} className="surface rounded-2xl p-5 sm:p-8">
        <input name="username" type="hidden" value={profile?.username ?? ""} />
        <div className="rounded-xl bg-[#fff8f9] p-4 text-sm text-[#725c63]">
          Ваша текущая страница: <b>{profile?.display_name}</b>
          {profile?.is_creator && (
            <span className="ml-2 rounded-full bg-[#fce5ec] px-2 py-1 text-xs font-semibold text-[#bd3e66]">
              Автор
            </span>
          )}
        </div>
        <div className="mt-5">
          <FieldLabel htmlFor="creator_headline">
            Коротко: что происходит на вашей странице?
          </FieldLabel>
          <input
            className={inputClassName}
            defaultValue={profile?.creator_headline ?? ""}
            id="creator_headline"
            maxLength={160}
            name="creator_headline"
            placeholder="Например: играю, общаюсь и иногда выхожу в эфир"
          />
        </div>
        <div className="mt-5">
          <FieldLabel htmlFor="current_bio" optional>
            Описание профиля
          </FieldLabel>
          <textarea
            className={textAreaClassName}
            defaultValue={profile?.bio ?? ""}
            disabled
            id="current_bio"
            placeholder="Описание можно изменить в настройках профиля"
          />
          <p className="mt-1.5 text-xs text-[#9b858c]">
            Существующее описание профиля показывается посетителям. Редактирование будет
            объединено с настройками страницы автора.
          </p>
        </div>
        <div className="mt-7 rounded-xl border border-[#f0e1e5] bg-[#fffafb] p-4 text-sm leading-6 text-[#725c63]">
          <b className="text-[#4d353d]">Что появится дальше:</b> подписчики, простые
          live-комнаты, донаты, подарки и creator-инструменты. Денежные функции
          запускаются только после настройки возраста, платёжного партнёра и правил
          безопасности.
        </div>
        <div className="mt-7 flex justify-end border-t border-[#f0e2e6] pt-5">
          <SubmitButton pendingLabel="Создаём страницу…">Создать страницу</SubmitButton>
        </div>
      </form>
    </main>
  );
}
