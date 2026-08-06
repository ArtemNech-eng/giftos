"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { ReportForm } from "@/components/report-form";
import { createClient } from "@/lib/supabase/client";

export type PlaceMessageView = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
};

/**
 * Realtime chat for a place: streams new messages, sends through the
 * browser client (RLS keeps writes scoped to the signed-in user).
 */
export function LivePlaceChat({
  placeId,
  currentUserId,
  initialMessages,
  initialAuthorRoles,
}: {
  placeId: string;
  currentUserId: string;
  initialMessages: PlaceMessageView[];
  initialAuthorRoles?: Record<string, string[]>;
}) {
  const [messages, setMessages] = useState<PlaceMessageView[]>(initialMessages);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialMessages.map((message) => [message.author_id, message.author_name]),
    ),
  );
  const [authorRoles] = useState<Record<string, string[]>>(initialAuthorRoles ?? {});
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const namesRef = useRef(names);
  const seenIds = useRef(new Set(initialMessages.map((message) => message.id)));
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabaseEnabled =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    namesRef.current = names;
  }, [names]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = createClient();

    async function resolveName(authorId: string) {
      if (authorId === currentUserId || namesRef.current[authorId]) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", authorId)
        .maybeSingle();
      if (data?.display_name) {
        namesRef.current = { ...namesRef.current, [authorId]: data.display_name };
        setNames(namesRef.current);
      }
    }

    const channel = supabase
      .channel(`place-chat:${placeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "place_messages",
          filter: `place_id=eq.${placeId}`,
        },
        (payload) => {
          const record = payload.new as {
            id: string;
            author_id: string;
            body: string;
            created_at: string;
          };
          if (!record?.id || seenIds.current.has(record.id)) return;
          seenIds.current.add(record.id);
          void resolveName(record.author_id);
          setMessages((prev) => [
            ...prev,
            {
              ...record,
              author_name:
                record.author_id === currentUserId
                  ? "Вы"
                  : (namesRef.current[record.author_id] ?? "Зритель"),
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [placeId, currentUserId, supabaseEnabled]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending || !supabaseEnabled) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("place_messages")
        .insert({ place_id: placeId, author_id: currentUserId, body: text });
      if (!error) setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3">
      <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-[#a9a1b4]">
            Пока тихо — напишите первым, кто здесь.
          </p>
        ) : (
          messages.map((message) => (
            <div className="flex items-start gap-2" key={message.id}>
              <p className="min-w-0 grow text-sm">
                <b className="mr-2">
                  {message.author_id === currentUserId
                    ? "Вы"
                    : (names[message.author_id] ?? message.author_name ?? "Зритель")}
                </b>
                {(authorRoles[message.author_id] ?? []).slice(0, 1).map((role) => (
                  <span
                    className="mr-1 rounded-full border border-[#ffd35e]/40 bg-[#2a2215] px-1.5 py-0.5 text-[9px] font-bold text-[#ffd35e]"
                    key={role}
                  >
                    {role}
                  </span>
                ))}
                {message.body}
              </p>
              {message.author_id !== currentUserId && (
                <ReportForm
                  returnTo={`/places/${placeId}`}
                  targetId={message.id}
                  targetType="place_message"
                />
              )}
            </div>
          ))
        )}
      </div>
      {supabaseEnabled && (
        <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
          <input
            className="grow rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            maxLength={2000}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Напишите сообщение"
            value={body}
          />
          <button
            className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={sending || !body.trim()}
            type="submit"
          >
            Отправить
          </button>
        </form>
      )}
    </div>
  );
}
