import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { decidePaidMessageRequest } from "@/app/creator/messages/actions";
import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Запросы на сообщения",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Request = {
  id: string;
  sender_id: string;
  body: string;
  price_minor: number;
  currency: string;
  status: string;
  created_at: string;
};

export default async function CreatorRequestsPage() {
  const { supabase, user } = await requireUser();
  const { data: rawRequests } = await supabase
    .from("paid_message_requests")
    .select("id, sender_id, body, price_minor, currency, status, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  const requests = (rawRequests ?? []) as Request[];
  const senderIds = [...new Set(requests.map((item) => item.sender_id))];
  const { data: senders } = senderIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", senderIds)
    : { data: [] };
  const senderById = new Map((senders ?? []).map((sender) => [sender.id, sender]));

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/creator/earnings"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Запросы</h1>
        <span className="w-9" />
      </header>
      <p className="mt-5 text-sm leading-6 text-[#b9b1c5]">
        В тестовом режиме деньги учитываются только после вашего принятия запроса.
        Настоящая оплата подключается позже.
      </p>
      <section className="mt-6 space-y-3">
        {requests.length > 0 ? (
          requests.map((request) => {
            const sender = senderById.get(request.sender_id);
            return (
              <article
                className="rounded-2xl border border-white/10 bg-[#171923] p-4"
                key={request.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <b className="block">{sender?.display_name ?? "Пользователь"}</b>
                    <small className="text-xs text-[#9f97aa]">
                      @{sender?.username ?? "user"}
                    </small>
                  </div>
                  <b className="text-[#ffd0eb]">{formatRubles(request.price_minor)}</b>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#ddd5e6]">
                  {request.body}
                </p>
                {request.status === "pending" ? (
                  <div className="mt-4 flex gap-2">
                    <form action={decidePaidMessageRequest}>
                      <input name="request_id" type="hidden" value={request.id} />
                      <input name="decision" type="hidden" value="accepted" />
                      <button
                        className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
                        type="submit"
                      >
                        Принять
                      </button>
                    </form>
                    <form action={decidePaidMessageRequest}>
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
            <MessageCircle className="mx-auto size-7" />
            <p className="mt-3">Новых запросов пока нет.</p>
          </div>
        )}
      </section>
    </main>
  );
}
