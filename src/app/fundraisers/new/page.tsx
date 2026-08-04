import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";

import { createFundraiser } from "@/app/fundraisers/actions";
import { FundraiserForm } from "@/components/fundraiser-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Новый сбор" };

export default async function NewFundraiserPage() {
  const { supabase, user } = await requireUser();
  const { data: wishes } = await supabase
    .from("wishes")
    .select("id, title, category_slug")
    .eq("author_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#a13d5e]"
        href="/"
      >
        <ArrowLeft className="size-4" /> К ленте
      </Link>
      <div className="mb-7 mt-6">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fff0cf] text-[#c7812e]">
          <Target className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-[#bd3e66]">Общая цель</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Создайте сбор</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
          Опишите цель, поделитесь ссылкой — и дайте людям возможность поддержать вас.
        </p>
      </div>
      <FundraiserForm action={createFundraiser} wishes={wishes ?? []} />
    </main>
  );
}
