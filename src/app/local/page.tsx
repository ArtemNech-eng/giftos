import Link from "next/link";
import { ArrowLeft, ChevronRight, Sparkles, Store } from "lucide-react";

import { LocalForm } from "@/components/local-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Локальная витрина",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function LocalCreatorPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: local }, { count: serviceCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name, city, city_id, profile_visibility, show_city")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("local_creator_profiles")
        .select("is_listed, role_code, city_label, headline")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("city_services")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id),
    ]);

  const canList = Boolean(
    profile?.city_id && profile.profile_visibility === "public" && profile.show_city,
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,.08)]"
          href="/settings"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-black tracking-[-0.03em]">Локальная витрина</h1>
        <span className="w-10" />
      </header>

      <Link
        className="mt-4 flex items-center justify-between rounded-2xl border border-[#e6d9ef] bg-white p-3.5 shadow-[0_6px_16px_rgba(69,43,94,.05)]"
        href="/services/mine"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#fff6e8] text-[#a87511]">
            <Store className="size-4.5" />
          </span>
          <span>
            <b className="block text-xs">Мои объявления</b>
            <small className="mt-0.5 block text-[10px] text-[#81748a]">
              {serviceCount ?? 0} на витрине города · управление, просмотры, поднятие
            </small>
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#a295a8]" />
      </Link>

      <section className="mt-6 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#f3e8ff] via-[#fff6fb] to-[#e7f4ff] p-5 shadow-[0_14px_34px_rgba(95,57,130,.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#8753e6]">
              Создают в городе
            </p>
            <h2 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.065em]">
              Стань заметным
              <br />
              среди своих.
            </h2>
          </div>
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#8753e6] shadow-[0_6px_16px_rgba(100,54,140,.1)]">
            <Sparkles className="size-6" />
          </span>
        </div>
        <p className="mt-4 max-w-sm text-[12px] leading-5 text-[#6e6178]">
          Не реклама на всю страну. Покажи, что ты создаёшь в{" "}
          {profile?.city ?? "своём городе"}, через stories, эфиры, места и события.
        </p>
      </section>

      <LocalForm
        canList={canList}
        initial={{
          is_listed: local?.is_listed ?? false,
          role_code: local?.role_code ?? null,
          city_label: local?.city_label ?? null,
          headline: local?.headline ?? null,
        }}
      />
    </main>
  );
}
