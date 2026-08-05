import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";

import { createWish } from "@/app/wishes/actions";
import { WishForm } from "@/components/wish-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Новое желание" };

export default async function NewWishPage() {
  await requireUser();

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
          <Heart className="size-6 fill-current" />
        </span>
        <p className="mt-4 text-sm font-semibold text-[#bd3e66]">
          С чего начинается «Хочу также»
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Создайте желание</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
          Желание можно оставить в профиле или позже превратить в коллективный сбор.
        </p>
      </div>
      <WishForm action={createWish} submitLabel="Создать желание" />
    </main>
  );
}
