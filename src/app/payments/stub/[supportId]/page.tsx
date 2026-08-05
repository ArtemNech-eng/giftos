import Link from "next/link";
import { CheckCircle2, FlaskConical, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { confirmStubPayment } from "@/app/payments/stub/[supportId]/actions";
import { formatRubles } from "@/lib/money";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Тестовая оплата" };
export const dynamic = "force-dynamic";

export default async function StubPaymentPage({
  params,
}: {
  params: Promise<{ supportId: string }>;
}) {
  const { supportId } = await params;
  const { supabase, user } = await requireUser();
  const { data: support } = await supabase
    .from("fundraiser_supports")
    .select(
      "id, fundraiser_id, supporter_id, amount_minor, currency, message, visibility, status, provider",
    )
    .eq("id", supportId)
    .eq("supporter_id", user.id)
    .maybeSingle();
  if (!support || support.provider !== "stub") notFound();

  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select("slug, title")
    .eq("id", support.fundraiser_id)
    .maybeSingle();
  if (!fundraiser) notFound();

  if (support.status === "succeeded") {
    return (
      <main className="grid min-h-screen place-items-center p-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-glow">
          <CheckCircle2 className="mx-auto size-11 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold">Поддержка уже подтверждена</h1>
          <p className="mt-3 text-sm leading-6 text-[#826c73]">
            Спасибо за участие в сборе.
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-[#df4f7d] px-4 py-2.5 text-sm font-semibold text-white"
            href={`/fundraisers/${fundraiser.slug}`}
          >
            Вернуться к сбору
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_24px_70px_rgba(83,37,52,0.13)] backdrop-blur sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fff0cf] text-[#c7812e]">
          <FlaskConical className="size-6" />
        </span>
        <p className="mt-5 text-sm font-semibold text-[#bd3e66]">
          Тестовый платёжный режим
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Подтвердите поддержку
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#826c73]">
          Деньги не списываются. Этот экран моделирует успешный callback платёжного
          партнёра.
        </p>
        <div className="mt-6 rounded-2xl bg-[#fff8f9] p-4">
          <p className="text-sm text-[#826c73]">Сбор</p>
          <p className="mt-1 font-bold">{fundraiser.title}</p>
          <p className="mt-4 text-2xl font-bold text-[#c53d68]">
            {formatRubles(support.amount_minor)}
          </p>
          {support.message && (
            <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-[#725c63]">
              «{support.message}»
            </p>
          )}
        </div>
        <form action={confirmStubPayment} className="mt-6">
          <input name="support_id" type="hidden" value={support.id} />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
            type="submit"
          >
            <ShieldCheck className="size-4" /> Подтвердить тестовую оплату
          </button>
        </form>
        <Link
          className="mt-4 block text-center text-sm font-semibold text-[#a13d5e]"
          href={`/fundraisers/${fundraiser.slug}`}
        >
          Отменить и вернуться
        </Link>
      </section>
    </main>
  );
}
