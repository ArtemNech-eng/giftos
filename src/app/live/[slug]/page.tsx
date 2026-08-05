import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Copy,
  Gift,
  HandCoins,
  MessageCircle,
  Square,
  UsersRound,
} from "lucide-react";

import { endLiveRoom, inviteLiveCohost, removeLiveCohost } from "@/app/live/actions";
import { sendTestLiveDonation } from "@/app/live/donations/actions";
import { sendTestLiveGift } from "@/app/live/gifts/actions";
import { LiveDonationEvents } from "@/components/live-donation-events";
import { LiveGiftCounter } from "@/components/live-gift-counter";
import { LiveGiftEvents } from "@/components/live-gift-events";
import { LiveKitRoom } from "@/components/livekit-room";
import { LiveRoomRealtime } from "@/components/live-room-realtime";
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
  if (!room) notFound();
  const [
    { data: host },
    { data: messages },
    { data: participants },
    { count: viewers },
    { data: wish },
    { data: gifts },
  ] = await Promise.all([
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
      .select("profile_id, role, left_at")
      .eq("room_id", room.id)
      .is("left_at", null),
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
    supabase
      .from("virtual_gifts")
      .select("code, label, emoji, price_minor")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);
  const [
    { count: giftCount },
    { count: donationCount },
    { data: giftTotal },
    { data: donationTotal },
  ] = await Promise.all([
    supabase
      .from("live_room_gifts")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id),
    supabase
      .from("live_room_donations")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id),
    supabase.from("live_room_gifts").select("price_minor").eq("room_id", room.id),
    supabase.from("live_room_donations").select("amount_minor").eq("room_id", room.id),
  ]);
  const giftTotalMinor = (giftTotal ?? []).reduce(
    (sum, gift) => sum + Number(gift.price_minor),
    0,
  );
  const donationTotalMinor = (donationTotal ?? []).reduce(
    (sum, donation) => sum + Number(donation.amount_minor),
    0,
  );
  const authorIds = [...new Set((messages ?? []).map((item) => item.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map(
    (authors ?? []).map((author) => [author.id, author.display_name]),
  );

  const cohosts = (participants ?? []).filter(
    (participant) => participant.role === "cohost",
  );
  const cohostIds = cohosts.map((cohost) => cohost.profile_id);
  const { data: cohostProfiles } = cohostIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", cohostIds)
    : { data: [] };
  const cohostNames = new Map(
    (cohostProfiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  const isCohost = cohostIds.includes(user.id);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        {room.host_id === user.id ? (
          <Link
            aria-label="Назад"
            className="bg-white/8 grid size-9 place-items-center rounded-full"
            href="/creator/dashboard"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : (
          <Link className="text-sm text-[#e3a3d5]" href="/feed">
            ← Лента
          </Link>
        )}
        <div className="flex items-center gap-2">
          {room.status === "live" ? (
            <>
              <LiveGiftCounter initialCount={giftCount ?? 0} roomId={room.id} />
              {room.host_id === user.id && (
                <Link
                  aria-label="Аналитика эфира"
                  className="bg-white/8 grid size-9 place-items-center rounded-full"
                  href={`/live/${slug}/analytics`}
                  title="Аналитика эфира"
                >
                  <BarChart3 className="size-4" />
                </Link>
              )}
            </>
          ) : (
            <button
              className="bg-white/8 grid size-9 place-items-center rounded-full"
              title="Скопировать ссылку"
              type="button"
            >
              <Copy className="size-4" />
            </button>
          )}
        </div>
      </header>
      <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#171923]">
        <div className="relative">
          <LiveKitRoom isHost={room.host_id === user.id} slug={slug} />
          <LiveGiftEvents
            currentUserId={user.id}
            gifts={(gifts ?? []).map((gift) => ({
              code: gift.code,
              label: gift.label,
              emoji: gift.emoji,
              price_minor: gift.price_minor,
            }))}
            roomId={room.id}
          />
          <LiveDonationEvents currentUserId={user.id} roomId={room.id} />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              {room.status === "live" ? (
                <p className="text-xs text-[#ff7fb5]">🔴 В ЭФИРЕ</p>
              ) : (
                <p className="text-xs text-[#9f97aa]">ЭФИР ЗАВЕРШЁН</p>
              )}
              <h1 className="mt-1 text-xl font-bold">{room.title}</h1>
              <p className="mt-1 text-sm text-[#b9b1c5]">
                {host?.display_name ?? "Автор"}
              </p>
            </div>
            {room.status === "live" ? (
              <span className="flex items-center gap-1 text-xs text-[#cfc6d8]">
                <UsersRound className="size-4" /> {viewers ?? 0}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-[#cfc6d8]">
                <UsersRound className="size-4" /> {viewers ?? 0}
              </span>
            )}
          </div>
          {room.description && (
            <p className="mt-4 text-sm leading-6 text-[#d8d0e0]">{room.description}</p>
          )}
          {wish && room.status === "live" && (
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
          {room.status === "ended" && (
            <div className="mt-4 rounded-xl bg-white/5 p-3">
              <p className="text-xs text-[#9f97aa]">Итоги эфира</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-[#d8d0e0]">
                  <MessageCircle className="size-4" /> {messages?.length ?? 0}
                </span>
                <span className="flex items-center gap-1 text-[#d8d0e0]">
                  <Gift className="size-4" /> {giftCount ?? 0}
                </span>
                <span className="flex items-center gap-1 text-[#d8d0e0]">
                  <HandCoins className="size-4" /> {donationCount ?? 0}
                </span>
                <span className="ml-auto text-[#ffd0eb]">
                  {((giftTotalMinor + donationTotalMinor) / 100).toLocaleString(
                    "ru-RU",
                  )}{" "}
                  ₽
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
      {room.status === "live" && (
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <div className="flex items-center gap-2">
            <UsersRound className="size-5 text-[#9e88ff]" />
            <h2 className="font-bold">В эфире</h2>
            <span className="ml-auto text-xs text-[#a9a1b4]">
              {viewers ?? 0} зрителей
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffd35e] to-[#ff9b3d] text-sm">
                👑
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {host?.display_name ?? "Ведущий"}
                  {room.host_id === user.id && (
                    <span className="ml-2 text-xs font-normal text-[#ffd35e]">
                      это вы
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#a9a1b4]">Ведущий</p>
              </div>
            </div>
            {cohosts.length === 0 ? (
              <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-[#a9a1b4]">
                Со-ведущих пока нет — пригласите второго ведущего.
              </p>
            ) : (
              cohosts.map((cohost) => (
                <div
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2"
                  key={cohost.profile_id}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e17dff] to-[#9e88ff] text-sm">
                    🎙
                  </span>
                  <div className="min-w-0 grow">
                    <p className="truncate text-sm font-semibold">
                      {cohostNames.get(cohost.profile_id) ?? "Со-ведущий"}
                      {cohost.profile_id === user.id && (
                        <span className="ml-2 text-xs font-normal text-[#e17dff]">
                          это вы
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#a9a1b4]">Со-ведущий</p>
                  </div>
                  {room.host_id === user.id && cohost.profile_id !== user.id && (
                    <form action={removeLiveCohost} className="shrink-0">
                      <input name="room_id" type="hidden" value={room.id} />
                      <input name="slug" type="hidden" value={slug} />
                      <input
                        name="profile_id"
                        type="hidden"
                        value={cohost.profile_id}
                      />
                      <button
                        className="rounded-lg border border-[#ff5b99]/40 px-2 py-1 text-xs text-[#ff9bc5]"
                        title="Снять со-ведущего"
                        type="submit"
                      >
                        Снять
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
          {isCohost && (
            <p className="mt-3 rounded-xl border border-[#e17dff]/30 bg-[#1b1528] px-3 py-2 text-xs text-[#e7c9f5]">
              Вы — со-ведущий: помогаете вести эфир вместе с ведущим.
            </p>
          )}
        </section>
      )}
      {room.status === "live" && room.host_id === user.id && (
        <form action={endLiveRoom} className="mt-5">
          <input name="slug" type="hidden" value={slug} />
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ff5b99]/40 bg-[#2a1222] py-3 text-sm font-bold text-[#ff9bc5]"
            type="submit"
          >
            <Square className="size-4" /> Завершить эфир
          </button>
        </form>
      )}
      {room.status === "live" &&
        room.host_id !== user.id &&
        gifts &&
        gifts.length > 0 && (
          <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
            <p className="font-bold">Отправить подарок в эфир</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gifts.map((gift) => (
                <form action={sendTestLiveGift} key={gift.code}>
                  <input name="room_id" type="hidden" value={room.id} />
                  <input name="slug" type="hidden" value={slug} />
                  <input name="gift_code" type="hidden" value={gift.code} />
                  <button
                    className="flex w-full flex-col items-center rounded-xl border border-white/10 bg-white/5 px-1 py-2 hover:border-[#ff77ba]"
                    type="submit"
                  >
                    <span className="text-2xl">{gift.emoji}</span>
                    <span className="mt-1 text-[10px]">{gift.label}</span>
                    <span className="text-[10px] text-[#ffb7dd]">
                      {gift.price_minor / 100} ₽
                    </span>
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#a9a1b4]">
              Подарки в тестовом режиме формируют test-доход автора.
            </p>
          </section>
        )}
      {room.status === "live" && room.host_id !== user.id && (
        <section className="mt-5 rounded-2xl border border-[#ff77ba]/25 bg-[#221522] p-4">
          <p className="font-bold">Поддержать эфир</p>
          <p className="mt-1 text-xs text-[#a9a1b4]">
            Донат с сообщением появится у всех зрителей поверх видео. Тестовый режим:
            деньги не списываются.
          </p>
          <form action={sendTestLiveDonation} className="mt-3 space-y-3">
            <input name="room_id" type="hidden" value={room.id} />
            <input name="slug" type="hidden" value={slug} />
            <div className="flex gap-2">
              <input
                className="w-32 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                inputMode="numeric"
                maxLength={8}
                min={1}
                name="amount_rubles"
                placeholder="Сумма, ₽"
                required
                type="number"
              />
              <input
                className="grow rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                maxLength={500}
                name="message"
                placeholder="Сообщение (до 500 символов)"
                required
              />
            </div>
            <button
              className="w-full rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] py-2.5 text-sm font-bold"
              type="submit"
            >
              Отправить донат
            </button>
          </form>
        </section>
      )}
      {room.status === "live" && room.host_id === user.id && (
        <form
          action={inviteLiveCohost}
          className="mt-5 rounded-2xl border border-[#b550ff]/35 bg-[#1b1528] p-4"
        >
          <input name="room_id" type="hidden" value={room.id} />
          <input name="slug" type="hidden" value={slug} />
          <p className="text-sm font-bold">Пригласить второго ведущего</p>
          <div className="mt-3 flex gap-2">
            <input
              className="grow rounded-xl border border-white/10 bg-black/20 px-3 text-sm"
              maxLength={30}
              name="username"
              placeholder="@username"
              required
            />
            <button
              className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
              type="submit"
            >
              Пригласить
            </button>
          </div>
        </form>
      )}
      <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-[#d68cff]" />
          <h2 className="font-bold">Чат эфира</h2>
          {room.status === "live" && (
            <span className="ml-auto text-xs text-[#a9a1b4]">в реальном времени</span>
          )}
        </div>
        {room.status === "live" ? (
          <LiveRoomRealtime
            currentUserId={user.id}
            initialMessages={(messages ?? []).map((message) => ({
              id: message.id,
              author_id: message.author_id,
              body: message.body,
              created_at: message.created_at,
              author_name: names.get(message.author_id) ?? "Зритель",
            }))}
            roomId={room.id}
          />
        ) : (
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
        )}
      </section>
    </main>
  );
}
