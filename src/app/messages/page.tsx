import Link from "next/link";
import type { Route } from "next";
import { MessageCircle, PenSquare } from "lucide-react";

import { requireUser } from "@/lib/auth";

export const metadata = { title: "Сообщения", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { supabase, user } = await requireUser();
  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("profile_id", user.id);
  const ids = (memberships ?? []).map((item) => item.conversation_id);
  const { data: conversations } = ids.length
    ? await supabase
        .from("conversations")
        .select("id, last_message_at, created_at")
        .in("id", ids)
        .order("last_message_at", { ascending: false, nullsFirst: false })
    : { data: [] };

  const rows = (conversations ?? []) as Array<{
    id: string;
    last_message_at: string | null;
    created_at: string;
  }>;
  const enriched = await Promise.all(
    rows.map(async (conversation) => {
      const [{ data: otherMembers }, { data: lastMessages }] = await Promise.all([
        supabase
          .from("conversation_members")
          .select("profile_id, profiles!inner(id, username, display_name)")
          .eq("conversation_id", conversation.id)
          .neq("profile_id", user.id)
          .limit(1),
        supabase
          .from("messages")
          .select("sender_id, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      const other = (otherMembers ?? [])[0] as
        | {
            profile_id: string;
            profiles: Array<{ id: string; username: string; display_name: string }>;
          }
        | undefined;
      const messages = (lastMessages ?? []) as Array<{
        sender_id: string;
        created_at: string;
      }>;
      const unread = messages.filter(
        (message) =>
          message.sender_id !== user.id &&
          (!conversation.last_message_at ||
            new Date(message.created_at).getTime() >=
              new Date(conversation.last_message_at).getTime()),
      ).length;
      return { ...conversation, other, unread };
    }),
  );
  const totalUnread = enriched.reduce((sum, item) => sum + item.unread, 0);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#241a2c]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8b5fbd]">
            Общение
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.055em]">Сообщения</h1>
        </div>
        <span className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8753e6] shadow-[0_6px_18px_rgba(64,38,88,0.08)]">
          <PenSquare className="size-5" />
        </span>
      </header>
      <nav className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-[#2c2036]/10 bg-white p-1 text-center text-xs font-bold">
        <span className="rounded-xl bg-[#f1e8ff] px-2 py-2 text-[#7549d0]">Все</span>
        <span className="px-2 py-2 text-[#807488]">Непрочитанные</span>
        <span className="px-2 py-2 text-[#807488]">Платные</span>
      </nav>
      {totalUnread > 0 && (
        <p className="mt-3 rounded-xl border border-[#ffb8d2] bg-[#fff0f6] px-3 py-2 text-xs font-semibold text-[#c44173]">
          {totalUnread} непрочитанных — не теряй разговоры.
        </p>
      )}
      {enriched.length > 0 ? (
        <div className="mt-5 space-y-2.5">
          {enriched.map((conversation, index) => {
            const other = conversation.other?.profiles?.[0];
            const gradients = [
              "from-[#ff79ad] to-[#ffca78]",
              "from-[#8d6bff] to-[#e46cff]",
              "from-[#52c4c0] to-[#78a4ff]",
            ];
            return (
              <Link
                className="flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,0.06)] transition hover:-translate-y-0.5 hover:border-[#9a62eb]/30"
                href={`/messages/${conversation.id}` as Route}
                key={conversation.id}
              >
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br text-base font-black text-white shadow-[0_6px_16px_rgba(67,42,90,0.16)] ${gradients[index % gradients.length]}`}
                >
                  {(other?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-black">
                    {other?.display_name ?? "Личный диалог"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#82758a]">
                    @{other?.username ?? "диалог"}
                  </span>
                </span>
                {conversation.unread > 0 ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-gradient-to-r from-[#ff4d8d] to-[#8753ed] px-1.5 py-1 text-[10px] font-black text-white">
                    {conversation.unread}
                  </span>
                ) : (
                  <span className="text-[#b6aaba]">›</span>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <section className="mt-10 rounded-[2rem] border border-dashed border-[#2c2036]/20 bg-white/70 p-7 text-center shadow-[0_10px_25px_rgba(69,43,94,0.04)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0e5ff] text-[#8b50df]">
            <MessageCircle className="size-6" />
          </span>
          <h2 className="mt-4 font-black">Здесь начнутся разговоры</h2>
          <p className="mt-2 text-sm leading-6 text-[#7d7085]">
            Диалог открывается только после принятого запроса — приватность остаётся у
            человека.
          </p>
        </section>
      )}
    </main>
  );
}
