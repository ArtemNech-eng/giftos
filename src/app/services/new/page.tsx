import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles } from "lucide-react";

import { ServiceCreateForm } from "@/components/service-create-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Добавить объявление",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city, city_id")
    .eq("id", user.id)
    .maybeSingle();
  const cityName = profile?.city ?? "Твой город";

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к объявлениям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/services"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская витрина
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новое объявление</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Briefcase className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#2e2250] via-[#4d3572] to-[#7559d5] p-5 text-white shadow-[0_14px_32px_rgba(63,37,98,.22)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#ffc3da]">
          <Sparkles className="size-3.5" /> {cityName} · бесплатно
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.075em]">
          ЗАЯВИ
          <br />
          СЕБЯ В ГОРОДЕ.
        </h2>
        <p className="mt-3 max-w-64 text-[11px] leading-5 text-white/75">
          Маникюр, ремонт, своё кафе — расскажи, чем ты полезен городу. Объявление
          увидят только жители твоего города.
        </p>
      </section>

      <ServiceCreateForm />
    </main>
  );
}
