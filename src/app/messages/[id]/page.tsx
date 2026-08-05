import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { notFound } from "next/navigation";

import { sendDirectMessage } from "@/app/messages/actions";
import { LiveConversationRefresh } from "@/components/live-conversation-refresh";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Диалог", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!membership) notFound();
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  const senderIds = [...new Set((messages ?? []).map((item) => item.sender_id))];
  const { data: profiles } = senderIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", senderIds)
    : { data: [] };
  const nameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#0c0e14] px-4 py-5 text-white">
      <LiveConversationRefresh conversationId={id} />
      <header className="flex items-center gap-3">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Личный диалог</h1>
      </header>
      <section className="mt-6 grow space-y-3">
        {(messages ?? []).map((message) => (
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_id === user.id ? "ml-auto bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]" : "bg-[#20222e]"}`}
            key={message.id}
          >
            <b className="mb-1 block text-xs opacity-80">
              {message.sender_id === user.id
                ? "Вы"
                : (nameById.get(message.sender_id) ?? "Автор")}
            </b>
            {message.body}
          </div>
        ))}
      </section>
      <form
        action={sendDirectMessage}
        className="mt-4 flex gap-2 border-t border-white/10 pt-4"
      >
        <input name="conversation_id" type="hidden" value={id} />
        <textarea
          className="min-h-11 grow rounded-xl border border-white/10 bg-[#171923] px-3 py-2 text-sm"
          maxLength={2000}
          name="body"
          placeholder="Сообщение"
          required
        />
        <button
          className="grid size-11 place-items-center rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"
          type="submit"
        >
          <Send className="size-4" />
        </button>
      </form>
    </main>
  );
}
