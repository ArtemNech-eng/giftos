"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Flame, Hand, Heart, Sparkles, ThumbsUp } from "lucide-react";

import { hideLiveMessage } from "@/app/live/actions";
import { createClient } from "@/lib/supabase/client";
import { ReportForm } from "@/components/report-form";

export type LiveRoomMessageView = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
};

const REACTION_BUTTONS: {
  code: string;
  icon: typeof Flame;
  label: string;
}[] = [
  { code: "fire", icon: Flame, label: "Огонь" },
  { code: "heart", icon: Heart, label: "Сердце" },
  { code: "like", icon: ThumbsUp, label: "Нравится" },
  { code: "clap", icon: Hand, label: "Аплодисменты" },
];

const REACTION_ICONS: Record<string, typeof Flame> = Object.fromEntries(
  REACTION_BUTTONS.map((reaction) => [reaction.code, reaction.icon]),
);

type FloatingReaction = { id: string; icon: typeof Flame; left: number };

/**
 * Realtime live room chat and reactions.
 *
 * - Streams `live_room_messages` INSERTs into the chat without page reloads.
 * - Streams `live_room_reactions` INSERTs as floating emoji animations.
 * - Sends messages and reactions through the browser client; RLS keeps writes
 *   scoped to the signed-in user (`author_id` / `profile_id = auth.uid()`).
 */
export function LiveRoomRealtime({
  roomId,
  roomSlug,
  currentUserId,
  initialMessages,
  canModerate = false,
}: {
  roomId: string;
  roomSlug: string;
  currentUserId: string;
  initialMessages: LiveRoomMessageView[];
  canModerate?: boolean;
}) {
  const [messages, setMessages] = useState<LiveRoomMessageView[]>(initialMessages);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialMessages.map((message) => [message.author_id, message.author_name]),
    ),
  );
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const seenMessageIds = useRef(new Set(initialMessages.map((message) => message.id)));
  const seenReactionIds = useRef(new Set<string>());
  const authorNamesRef = useRef(authorNames);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Render window: keep the full list in state for realtime, but only render
  // the latest chunk so the DOM never grows unbounded.
  const [renderCount, setRenderCount] = useState(100);

  const supabaseEnabled =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    authorNamesRef.current = authorNames;
  }, [authorNames]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const nearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (nearBottom) element.scrollTop = element.scrollHeight;
  }, [messages, renderCount]);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = createClient();

    async function resolveAuthorName(authorId: string) {
      if (authorId === currentUserId || authorNamesRef.current[authorId]) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", authorId)
        .maybeSingle();
      if (data?.display_name) {
        authorNamesRef.current = {
          ...authorNamesRef.current,
          [authorId]: data.display_name,
        };
        setAuthorNames(authorNamesRef.current);
      }
    }

    const channel = supabase
      .channel(`live-room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const record = payload.new as {
            id: string;
            author_id: string;
            body: string;
            created_at: string;
          };
          if (!record?.id || seenMessageIds.current.has(record.id)) return;
          seenMessageIds.current.add(record.id);
          void resolveAuthorName(record.author_id);
          const authorName =
            record.author_id === currentUserId
              ? "Вы"
              : (authorNamesRef.current[record.author_id] ?? "Зритель");
          setMessages((prev) => [...prev, { ...record, author_name: authorName }]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const record = payload.new as { id: string; is_hidden?: boolean };
          // Hidden messages disappear from the chat instantly for everyone.
          if (record?.id && record.is_hidden) {
            seenMessageIds.current.delete(record.id);
            setMessages((prev) => prev.filter((message) => message.id !== record.id));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_room_reactions",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const record = payload.new as { id: string; reaction_code: string };
          if (!record?.id || seenReactionIds.current.has(record.id)) return;
          seenReactionIds.current.add(record.id);
          const item: FloatingReaction = {
            id: record.id,
            icon: REACTION_ICONS[record.reaction_code] ?? Sparkles,
            left: 10 + Math.random() * 70,
          };
          setFloating((prev) => [...prev.slice(-14), item]);
          setTimeout(() => {
            setFloating((prev) => prev.filter((reaction) => reaction.id !== item.id));
          }, 3000);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, supabaseEnabled]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending || !supabaseEnabled) return;
    setSending(true);
    setSendError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("live_room_messages")
        .insert({ room_id: roomId, author_id: currentUserId, body: text });
      if (!error) {
        setBody("");
      } else if (error.message.includes("live_chat_rate_limit")) {
        setSendError("Слишком много сообщений — подождите минуту.");
      } else {
        setSendError("Не удалось отправить сообщение.");
      }
    } finally {
      setSending(false);
    }
  }

  async function sendReaction(code: string) {
    if (!supabaseEnabled) return;
    try {
      const supabase = createClient();
      await supabase
        .from("live_room_reactions")
        .insert({ room_id: roomId, profile_id: currentUserId, reaction_code: code });
    } catch {
      // Realtime streams the event back; transient failures are non-blocking.
    }
  }

  return (
    <div className="relative">
      <div
        className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1"
        onScroll={(event) => {
          const element = event.currentTarget;
          if (element.scrollTop < 60 && messages.length > renderCount) {
            setRenderCount((value) => Math.min(messages.length, value + 100));
          }
        }}
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-[#a9a1b4]">
            Пока тихо — напишите первое сообщение или отправьте реакцию.
          </p>
        ) : (
          messages.slice(-renderCount).map((message) => (
            <div className="flex items-start gap-1.5" key={message.id}>
              <p className="min-w-0 grow text-sm">
                <b className="mr-2">
                  {message.author_id === currentUserId
                    ? "Вы"
                    : (authorNames[message.author_id] ??
                      message.author_name ??
                      "Зритель")}
                </b>
                {message.body}
              </p>
              {canModerate && message.author_id !== currentUserId && (
                <form action={hideLiveMessage}>
                  <input name="message_id" type="hidden" value={message.id} />
                  <button
                    className="rounded-md px-1 py-0.5 text-xs text-[#8e747c] transition hover:bg-rose-50 hover:text-[#bd3e66]"
                    title="Скрыть сообщение"
                    type="submit"
                  >
                    скрыть
                  </button>
                </form>
              )}
              {message.author_id !== currentUserId && (
                <ReportForm
                  returnTo={`/live/${roomSlug}`}
                  targetId={message.id}
                  targetType="live_message"
                />
              )}
            </div>
          ))
        )}
      </div>
      {sendError && (
        <p className="mt-2 rounded-lg bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300">
          {sendError}
        </p>
      )}
      {floating.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 h-44 overflow-hidden">
          {floating.map((reaction) => (
            <span
              className="live-reaction-float absolute bottom-0 text-3xl drop-shadow-lg"
              key={reaction.id}
              style={{ left: `${reaction.left}%` }}
            >
              <reaction.icon className="size-7" />
            </span>
          ))}
        </div>
      )}
      {supabaseEnabled && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-[#a9a1b4]">Реакции:</span>
          {REACTION_BUTTONS.map((reaction) => (
            <button
              aria-label={reaction.label}
              className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-xl transition hover:scale-110 hover:border-[#ff77ba] active:scale-95"
              key={reaction.code}
              onClick={() => void sendReaction(reaction.code)}
              title={reaction.label}
              type="button"
            >
              <reaction.icon className="size-5" />
            </button>
          ))}
        </div>
      )}
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
    </div>
  );
}
