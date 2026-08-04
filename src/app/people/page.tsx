import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";

import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Люди" };

export default function PeoplePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <section className="surface rounded-2xl p-7 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fce5ec] text-[#d34872]">
            <UsersRound className="size-7" />
          </span>
          <p className="mt-5 text-sm font-semibold text-[#bd3e66]">
            Скоро здесь будет каталог
          </p>
          <h1 className="mt-2 text-2xl font-bold">Люди и их желания</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#826c73]">
            После подключения Supabase здесь появятся профили, интересы и способы найти
            единомышленников.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#b13f61]"
            href="/"
          >
            <ArrowLeft className="size-4" /> К ленте
          </Link>
        </section>
      </main>
    </>
  );
}
