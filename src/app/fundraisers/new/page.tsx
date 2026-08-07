import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";

import { createFundraiser } from "@/app/fundraisers/actions";
import { FundraiserForm } from "@/components/fundraiser-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать сбор",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewFundraiserPage() {
  const { supabase, user } = await requireUser();
  const { data: wishes } = await supabase
    .from("wishes")
    .select("id, title, category_slug")
    .eq("author_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к желаниям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/wishes"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Общая цель
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новый сбор</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Target className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_32px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          <Target className="size-3.5" /> Добровольное продолжение
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          Собери людей
          <br />
          вокруг цели.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-[#756a7d]">
          Сбор — не обязательная часть желания. Создавай его, когда хочешь дать своей
          цели отдельную историю и безопасный путь поддержки.
        </p>
      </section>

      <FundraiserForm action={createFundraiser} wishes={wishes ?? []} />
    </main>
  );
}
