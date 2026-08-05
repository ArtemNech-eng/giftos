import Link from "next/link";
import { CircleDot, Copy, MessageCircle, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { sendLiveRoomMessage } from "@/app/live/actions";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Эфир", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LiveRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user } = await requireUser();
  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, host_id, title, description, status, wish_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!room || room.status !== "live") notFound();
  const [{ data: host }, { data: messages }, { count: viewers }, { data: wish }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", room.host_id)
        .maybeSingle(),
      supabase
        .from("live_room_messages")
        .select("id, author_id, body, created_at")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("live_room_participants")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)
        .is("left_at", null),
      room.wish_id
        ? supabase
            .from("wishes")
            .select("id, title, estimated_cost_minor")
            .eq("id", room.wish_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const authorIds = [...new Set((messages ?? []).map((item) => item.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map(
    (authors ?? []).map((author) => [author.id, author.display_name]),
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link className="text-sm text-[#e3a3d5]" href="/feed">
          ← Лента
        </Link>
        <button className="bg-white/8 grid size-9 place-items-center rounded-full">
          <Copy className="size-4" />
        </button>
      </header>
      <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#171923]">
        <div className="grid aspect-video place-items-center bg-gradient-to-br from-[#3b193d] via-[#1f1a38] to-[#151a2c] text-center">
          <div>
            <CircleDot className="mx-auto size-10 text-[#ff5b99]" />
            <p className="mt-3 text-sm font-bold">Live room v1</p>
            <p className="mt-1 text-xs text-[#b9b1c5]">
              Видео подключается через следующий media-интеграционный срез
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#ff7fb5]">🔴 В ЭФИРЕ</p>
              <h1 className="mt-1 text-xl font-bold">{room.title}</h1>
              <p className="mt-1 text-sm text-[#b9b1c5]">
                {host?.display_name ?? "Автор"}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-[#cfc6d8]">
              <UsersRound className="size-4" /> {viewers ?? 0}
            </span>
          </div>
          {room.description && (
            <p className="mt-4 text-sm leading-6 text-[#d8d0e0]">{room.description}</p>
          )}
          {wish && (
            <Link
              className="mt-4 flex justify-between rounded-xl bg-[#281633] p-3"
              href={`/wishes/${wish.id}`}
            >
              <span>
                <b className="block text-sm">🎯 {wish.title}</b>
                <small className="text-xs text-[#b9b1c5]">
                  Поддержать желание автора
                </small>
              </span>
              <b className="text-sm text-[#ffd0eb]">
                {wish.estimated_cost_minor
                  ? `${wish.estimated_cost_minor / 100} ₽`
                  : "Цель"}
              </b>
            </Link>
          )}
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-[#d68cff]" />
          <h2 className="font-bold">Чат эфира</h2>
        </div>
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
          {(messages ?? []).map((message) => (
            <p className="text-sm" key={message.id}>
              <b className="mr-2">
                {message.author_id === user.id
                  ? "Вы"
                  : (names.get(message.author_id) ?? "Зритель")}
              </b>
              {message.body}
            </p>
          ))}
        </div>
        <form action={sendLiveRoomMessage} className="mt-4 flex gap-2">
          <input name="room_id" type="hidden" value={room.id} />
          <input name="slug" type="hidden" value={slug} />
          <input
            className="grow rounded-xl border border-white/10 bg-black/20 px-3 text-sm"
            maxLength={2000}
            name="body"
            placeholder="Напишите сообщение"
            required
          />
          <button
            className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
            type="submit"
          >
            Отправить
          </button>
        </form>
      </section>
    </main>
  );
}
