import Link from "next/link";
import { Archive, ArrowLeft, Heart } from "lucide-react";
import { notFound } from "next/navigation";

import { archiveWish, updateWish } from "@/app/wishes/actions";
import { WishForm } from "@/components/wish-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Редактирование желания",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к желанию"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={`/wishes/${wish.id}`}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Ваше желание
          </small>
          <h1 className="mt-0.5 text-sm font-black">Редактирование</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Heart className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_32px_rgba(69,43,94,.1)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#d84b81]">
              <Heart className="size-3.5" /> История мечты
            </span>
            <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
              {wish.title}
            </h2>
            <p className="mt-3 text-[11px] leading-5 text-[#756a7d]">
              Обновите детали — желание останется в вашем профиле и городе.
            </p>
          </div>
          {!wish.is_archived && (
            <form action={archiveWish}>
              <input name="wish_id" type="hidden" value={wish.id} />
              <button
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-black text-[#8e6672] transition hover:bg-rose-50 hover:text-[#bc3e66]"
                type="submit"
              >
                <Archive className="size-3.5" /> В архив
              </button>
            </form>
          )}
        </div>
      </section>

      {wish.is_archived ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Это желание находится в архиве и не видно в профиле.
        </p>
      ) : null}

      <WishForm action={updateWish} submitLabel="Сохранить изменения" values={wish} />
    </main>
  );
}
