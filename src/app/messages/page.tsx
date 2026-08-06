import Link from "next/link";
import type { Route } from "next";
import { MessageCircle } from "lucide-react";

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

  // Load the other member of each conversation and unread counts.
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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Сообщения</h1>
        <MessageCircle className="size-5 text-[#d68cff]" />
      </header>
      {totalUnread > 0 && (
        <p className="mt-3 rounded-xl border border-[#ff4b8a]/30 bg-[#2a1222] px-3 py-2 text-xs text-[#ff9bc5]">
          {totalUnread} непрочитанных
        </p>
      )}
      {enriched.length > 0 ? (
        <div className="mt-6 space-y-2">
          {enriched.map((conversation) => {
            const other = conversation.other?.profiles?.[0];
            return (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-4"
                href={`/messages/${conversation.id}` as Route}
                key={conversation.id}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3b193d] to-[#1f1a38] text-sm font-bold">
                  {(other?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-bold">
                    {other?.display_name ?? "Личный диалог"}
                  </span>
                  <span className="block truncate text-xs text-[#9f97aa]">
                    @{other?.username ?? "—"}
                  </span>
                </span>
                {conversation.unread > 0 && (
                  <span className="rounded-full bg-[#ff4b8a] px-2 py-0.5 text-[10px] font-bold text-white">
                    {conversation.unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa2b4]">
          Диалоги появятся здесь после принятого запроса на сообщение.
        </div>
      )}
    </main>
  );
}
