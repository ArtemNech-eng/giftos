import Link from "next/link";
import { Gift, MapPin } from "lucide-react";

import { AuthForm } from "@/app/auth/sign-in/auth-form";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Вход" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; ref?: string }>;
}) {
  const { city: rawCity, ref } = await searchParams;
  const city = rawCity
    ? rawCity.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase())
    : null;
  const isCityInvite = Boolean(city && ref);

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_24px_70px_rgba(83,37,52,0.13)] backdrop-blur sm:p-8">
        <Link className="inline-flex items-center gap-2 font-bold" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-[#df4f7d] text-white">
            <Gift className="size-5" />
          </span>
          {APP_NAME}
        </Link>
        <h1 className="mt-7 text-2xl font-bold tracking-tight">Добро пожаловать</h1>
        <p className="mt-2 text-sm leading-6 text-[#826c73]">
          Войдите или создайте аккаунт — это займёт всего минуту.
        </p>
        {isCityInvite && city && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#d8b6ff]/60 bg-[#f7efff] p-3.5 text-[#472a6b]">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#8150df] text-white">
              <MapPin className="size-5" />
            </span>
            <span>
              <b className="block text-sm">Вас пригласили в {city}</b>
              <span className="mt-0.5 block text-xs leading-5 text-[#765d91]">
                Город будет предзаполнен в профиле — его можно изменить при регистрации.
              </span>
            </span>
          </div>
        )}
        <AuthForm />
        <p className="mt-6 text-center text-xs leading-5 text-[#9c858c]">
          Продолжая, вы принимаете правила платформы и политику конфиденциальности.
        </p>
      </section>
    </main>
  );
}
