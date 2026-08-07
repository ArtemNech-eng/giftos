import Link from "next/link";
import { ArrowLeft, Check, MessageCircle, X } from "lucide-react";

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
          <h1 className="mt-0.5 text-sm font-black">Запросы на сообщения</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <MessageCircle className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 rounded-2xl bg-[#f0faf5] p-3.5 text-[10px] leading-5 text-[#4c7169]">
        В тестовом режиме деньги учитываются только после вашего принятия запроса.
        Настоящая оплата подключается позже.
      </section>

      <section className="mt-5 space-y-3">
        {requests.length > 0 ? (
          requests.map((request) => {
            const sender = senderById.get(request.sender_id);
            const accepted = request.status === "accepted";
            return (
              <article
                className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                key={request.id}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <b className="block truncate text-xs font-black">
                      {sender?.display_name ?? "Пользователь"}
                    </b>
                    <small className="text-[10px] text-[#81748a]">
                      @{sender?.username ?? "user"}
                    </small>
                  </div>
                  <b className="shrink-0 text-sm font-black text-[#7549d0]">
                    {formatRubles(request.price_minor)}
                  </b>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fbf9fe] p-3 text-xs leading-5 text-[#5f5369]">
                  {request.body}
                </p>
                {request.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <form action={decidePaidMessageRequest}>
                      <input name="request_id" type="hidden" value={request.id} />
                      <input name="decision" type="hidden" value="accepted" />
                      <button
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2 text-xs font-black text-white shadow-[0_6px_14px_rgba(160,75,213,.24)]"
                        type="submit"
                      >
                        <Check className="size-3.5" /> Принять
                      </button>
                    </form>
                    <form action={decidePaidMessageRequest}>
                      <input name="request_id" type="hidden" value={request.id} />
                      <input name="decision" type="hidden" value="rejected" />
                      <button
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-4 py-2 text-xs font-black text-[#5f5369]"
                        type="submit"
                      >
                        <X className="size-3.5" /> Отклонить
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="mt-3 text-[10px] font-black text-[#81748a]">
                    {accepted ? "Принят" : "Отклонён"}
                  </p>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cdbbe7] bg-white p-6 text-center">
            <MessageCircle className="mx-auto size-7 text-[#8753e6]" />
            <p className="mt-3 text-xs font-black text-[#5f5369]">
              Новых запросов пока нет.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
