import Link from "next/link";
import { Gift } from "lucide-react";

import { AuthForm } from "@/app/auth/sign-in/auth-form";

export const metadata = { title: "Вход" };

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_24px_70px_rgba(83,37,52,0.13)] backdrop-blur sm:p-8">
        <Link className="inline-flex items-center gap-2 font-bold" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-[#df4f7d] text-white">
            <Gift className="size-5" />
          </span>
          GiftOS
        </Link>
        <h1 className="mt-7 text-2xl font-bold tracking-tight">Добро пожаловать</h1>
        <p className="mt-2 text-sm leading-6 text-[#826c73]">
          Войдите или создайте аккаунт — это займёт всего минуту.
        </p>
        <AuthForm />
        <p className="mt-6 text-center text-xs leading-5 text-[#9c858c]">
          Продолжая, вы принимаете правила платформы и политику конфиденциальности.
        </p>
      </section>
    </main>
  );
}
