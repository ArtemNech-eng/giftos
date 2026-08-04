import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { notFound } from "next/navigation";

import { archiveWish, updateWish } from "@/app/wishes/actions";
import { WishForm } from "@/components/wish-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Редактирование желания" };

export default async function EditWishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: wish } = await supabase
    .from("wishes")
    .select(
      "id, title, description, product_url, estimated_cost_minor, category_slug, visibility, source_wish_id, is_archived",
    )
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!wish) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#a13d5e]"
        href="/"
      >
        <ArrowLeft className="size-4" /> К ленте
      </Link>
      <div className="mb-7 mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">Ваше желание</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Редактирование</h1>
        </div>
        {!wish.is_archived && (
          <form action={archiveWish}>
            <input name="wish_id" type="hidden" value={wish.id} />
            <button
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#8e6672] transition hover:bg-rose-50 hover:text-[#bc3e66]"
              type="submit"
            >
              <Archive className="size-4" /> Архивировать
            </button>
          </form>
        )}
      </div>
      {wish.is_archived ? (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Это желание находится в архиве и не видно в профиле.
        </p>
      ) : null}
      <WishForm action={updateWish} submitLabel="Сохранить изменения" values={wish} />
    </main>
  );
}
