import Link from "next/link";
import { ArrowLeft, CalendarCheck } from "lucide-react";

import { decideCreatorOfferRequest } from "@/app/creator/offers/requests/actions";
import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Запросы на действия",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Request = {
  id: string;
  requester_id: string;
  note: string | null;
  price_minor: number;
  status: string;
  created_at: string;
  offer_id: string;
};

export default async function CreatorOfferRequestsPage() {
  const { supabase, user } = await requireUser();
  const { data: rawRequests } = await supabase
    .from("creator_offer_requests")
    .select("id, requester_id, note, price_minor, status, created_at, offer_id")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  const requests = (rawRequests ?? []) as Request[];
  const requesterIds = [...new Set(requests.map((item) => item.requester_id))];
  const offerIds = [...new Set(requests.map((item) => item.offer_id))];
  const [{ data: requesters }, { data: offers }] = await Promise.all([
    requesterIds.length
      ? supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", requesterIds)
      : Promise.resolve({ data: [] }),
    offerIds.length
      ? supabase.from("creator_offers").select("id, title, kind").in("id", offerIds)
      : Promise.resolve({ data: [] }),
  ]);
  const requesterById = new Map((requesters ?? []).map((item) => [item.id, item]));
  const offerById = new Map((offers ?? []).map((item) => [item.id, item]));

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/creator/earnings"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Запросы на действия</h1>
        <span className="w-9" />
      </header>
      <p className="mt-5 text-sm leading-6 text-[#b9b1c5]">
        В тестовом режиме доход фиксируется только после вашего принятия запроса.
      </p>
      <section className="mt-6 space-y-3">
        {requests.length ? (
          requests.map((request) => {
            const requester = requesterById.get(request.requester_id);
            const offer = offerById.get(request.offer_id);
            return (
              <article
                className="rounded-2xl border border-white/10 bg-[#171923] p-4"
                key={request.id}
              >
                <div className="flex items-start justify-between">
                  <span>
                    <b className="block">{offer?.title ?? "Действие"}</b>
                    <small className="text-xs text-[#9f97aa]">
                      Запрос от {requester?.display_name ?? "пользователя"}
                    </small>
                  </span>
                  <b className="text-[#ffd0eb]">{formatRubles(request.price_minor)}</b>
                </div>
                {request.note && (
                  <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm leading-6 text-[#ded6e6]">
                    {request.note}
                  </p>
                )}
                {request.status === "pending" ? (
                  <div className="mt-4 flex gap-2">
                    <form action={decideCreatorOfferRequest}>
                      <input name="request_id" type="hidden" value={request.id} />
                      <input name="decision" type="hidden" value="accepted" />
                      <button
                        className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
                        type="submit"
                      >
                        Принять
                      </button>
                    </form>
                    <form action={decideCreatorOfferRequest}>
                      <input name="request_id" type="hidden" value={request.id} />
                      <input name="decision" type="hidden" value="rejected" />
                      <button
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold"
                        type="submit"
                      >
                        Отклонить
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-[#b9b1c5]">
                    {request.status === "accepted" ? "Принят" : "Отклонён"}
                  </p>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa2b4]">
            <CalendarCheck className="mx-auto size-7" />
            <p className="mt-3">Запросов на действия пока нет.</p>
          </div>
        )}
      </section>
    </main>
  );
}
