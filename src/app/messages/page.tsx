import Link from "next/link";
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
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Сообщения</h1>
        <MessageCircle className="size-5 text-[#d68cff]" />
      </header>
      {(conversations ?? []).length > 0 ? (
        <div className="mt-6 space-y-2">
          {conversations!.map((conversation) => (
            <Link
              className="block rounded-2xl border border-white/10 bg-[#171923] p-4"
              href={`/messages/${conversation.id}`}
              key={conversation.id}
            >
              <b>Личный диалог</b>
              <small className="mt-1 block text-xs text-[#9f97aa]">
                Открыть переписку ›
              </small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa2b4]">
          Диалоги появятся здесь после принятого запроса на сообщение.
        </div>
      )}
    </main>
  );
}
