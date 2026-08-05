import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";

import { createLiveRoom } from "@/app/live/actions";
import { CATEGORIES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать эфир",
  robots: { index: false, follow: false },
};

export default async function NewLivePage() {
  const { supabase, user } = await requireUser();
  const { data: wishes } = await supabase
    .from("wishes")
    .select("id, title")
    .eq("author_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <Link
        className="inline-flex items-center gap-2 text-sm text-[#e4a3d5]"
        href="/creator/dashboard"
      >
        <ArrowLeft className="size-4" /> Панель автора
      </Link>
      <div className="mt-6">
        <Radio className="size-8 text-[#d98cff]" />
        <p className="mt-4 text-sm font-semibold text-[#d98cff]">Live room v1</p>
        <h1 className="mt-1 text-3xl font-bold">Начать эфир</h1>
        <p className="mt-3 text-sm leading-6 text-[#b9b1c5]">
          Создайте комнату, получите ссылку и пригласите друзей. Видеомост подключается
          следующим media-срезом.
        </p>
      </div>
      <form
        action={createLiveRoom}
        className="mt-7 space-y-4 rounded-2xl border border-white/10 bg-[#171923] p-5"
      >
        <input
          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
          maxLength={160}
          name="title"
          placeholder="Название эфира"
          required
        />
        <textarea
          className="min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
          maxLength={1000}
          name="description"
          placeholder="О чём будет эфир?"
        />
        <select
          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
          defaultValue=""
          name="category_slug"
        >
          <option value="">Категория</option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.emoji} {category.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
          defaultValue=""
          name="wish_id"
        >
          <option value="">Связать с желанием (необязательно)</option>
          {(wishes ?? []).map((wish) => (
            <option key={wish.id} value={wish.id}>
              {wish.title}
            </option>
          ))}
        </select>
        <button
          className="w-full rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] py-3 text-sm font-bold"
          type="submit"
        >
          Создать комнату
        </button>
      </form>
    </main>
  );
}
