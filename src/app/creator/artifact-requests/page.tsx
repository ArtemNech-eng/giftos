import Link from "next/link";
import { ArrowLeft, Check, Gem, X } from "lucide-react";

import {
  acceptArtifactRequest,
  rejectArtifactRequest,
} from "@/app/creator/artifact-requests/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Запросы на артефакты",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  sender_id: string;
  series_id: string;
  note: string | null;
  status: string;
  created_at: string;
  profiles: Array<{ display_name: string; username: string }>;
  collectible_artifact_series: Array<{
    title: string;
    price_stars: number;
    artwork_path: string;
  }>;
};

export default async function CreatorArtifactRequestsPage() {
  const { supabase, user } = await requireUser();
  const { data: rawRequests } = await supabase
    .from("creator_artifact_requests")
    .select(
      "id, sender_id, series_id, note, status, created_at, profiles!inner(display_name, username), collectible_artifact_series!inner(title, price_stars, artwork_path)",
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const requests = ((rawRequests ?? []) as RequestRow[]).map((row) => ({
    ...row,
    sender: row.profiles?.[0],
    series: row.collectible_artifact_series?.[0],
  }));

  const pending = requests.filter((request) => request.status === "pending");
  const decided = requests.filter((request) => request.status !== "pending");

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к доходам"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/creator/earnings"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Панель автора
          </small>
          <h1 className="mt-0.5 text-sm font-black">Артефакты-поддержка</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Gem className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 rounded-2xl bg-[#f0faf5] p-3.5 text-[10px] leading-5 text-[#4c7169]">
        Кто-то выбрал артефакт в подарок вам. Только после вашего принятия предмет будет
        создан, со счёта отправителя спишутся ⭐, а вам начислится тестовый доход 80/20.
      </section>

      {requests.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#cdbbe7] bg-white p-6 text-center">
          <Gem className="mx-auto size-7 text-[#8753e6]" />
          <p className="mt-3 text-xs font-black text-[#5f5369]">Запросов пока нет.</p>
          <p className="mt-1 text-[10px] leading-5 text-[#81748a]">
            Когда кто-то захочет поддержать вас артефактом, он появится здесь.
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-black">Новые запросы</h2>
              <div className="mt-3 space-y-3">
                {pending.map((request) => (
                  <article
                    className="rounded-2xl border border-[#e5d5ff] bg-white p-4 shadow-[0_6px_18px_rgba(117,73,208,.08)]"
                    key={request.id}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e8d5ff] to-[#ffd9ec] text-[#8753e6]">
                        <Gem className="size-5" />
                      </span>
                      <span className="min-w-0 grow">
                        <b className="block truncate text-xs font-black">
                          {request.series?.title ?? "Артефакт"}
                        </b>
                        <small className="text-[10px] text-[#81748a]">
                          от {request.sender?.display_name ?? "пользователя"} · @
                          {request.sender?.username ?? "user"}
                        </small>
                      </span>
                      <b className="shrink-0 text-sm font-black text-[#7549d0]">
                        {request.series?.price_stars ?? 0} ⭐
                      </b>
                    </div>
                    {request.note && (
                      <p className="mt-3 rounded-xl bg-[#fbf9fe] p-3 text-xs leading-5 text-[#5f5369]">
                        {request.note}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <form action={acceptArtifactRequest}>
                        <input name="request_id" type="hidden" value={request.id} />
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2 text-xs font-black text-white shadow-[0_6px_14px_rgba(160,75,213,.24)]"
                          type="submit"
                        >
                          <Check className="size-3.5" /> Принять
                        </button>
                      </form>
                      <form action={rejectArtifactRequest}>
                        <input name="request_id" type="hidden" value={request.id} />
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-4 py-2 text-xs font-black text-[#5f5369]"
                          type="submit"
                        >
                          <X className="size-3.5" /> Отклонить
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {decided.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-black">Решённые</h2>
              <div className="mt-3 space-y-2">
                {decided.map((request) => (
                  <div
                    className="border-[#2c2036]/9 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                    key={request.id}
                  >
                    <span className="min-w-0">
                      <b className="block truncate text-xs font-black">
                        {request.series?.title ?? "Артефакт"}
                      </b>
                      <small className="text-[10px] text-[#81748a]">
                        от {request.sender?.display_name ?? "пользователя"}
                      </small>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                        request.status === "accepted"
                          ? "bg-[#e4f7ed] text-[#19885e]"
                          : "bg-[#f0eaf5] text-[#8e8797]"
                      }`}
                    >
                      {request.status === "accepted"
                        ? `Принят · +${Math.round((request.series?.price_stars ?? 0) * 0.8)} ⭐`
                        : "Отклонён"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
