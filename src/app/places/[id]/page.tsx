import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, MapPin, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { enterPlace, joinPlace, leavePlace } from "@/app/places/actions";
import { LivePlaceChat } from "@/components/live-place-chat";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Место",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ONLINE_WINDOW = 15 * 60 * 1000;

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: place } = await supabase
    .from("places")
    .select("id, city_id, creator_id, name, description, emoji, kind")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!place) notFound();

  const cutoff = new Date(Date.now() - ONLINE_WINDOW).toISOString();
  const [{ data: presence }, { data: messages }, { data: member }] = await Promise.all([
    supabase
      .from("place_presence")
      .select("profile_id, last_seen_at")
      .eq("place_id", id)
      .gte("last_seen_at", cutoff)
      .order("last_seen_at", { ascending: false })
      .limit(30),
    supabase
      .from("place_messages")
      .select("id, author_id, body, created_at")
      .eq("place_id", id)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("place_members")
      .select("place_id")
      .eq("place_id", id)
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);
  const online = (presence ?? []).length;
  const onlineIds = (presence ?? []).map((row) => row.profile_id);
  const { data: onlineProfiles } = onlineIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, is_creator")
        .in("id", onlineIds)
    : { data: [] };
  const profileById = new Map(
    (onlineProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const people = (presence ?? [])
    .map((row) => profileById.get(row.profile_id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const authorIds = [...new Set((messages ?? []).map((m) => m.author_id))];
  const { data: authorProfiles } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map(
    (authorProfiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );

  const isMember = Boolean(member);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/places"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">
          {place.emoji} {place.name}
        </h1>
        <span className="w-9" />
      </header>

      <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-[#9e88ff]" />
          <p className="text-sm font-bold">
            Сейчас здесь {online}{" "}
            {online === 1
              ? "человек"
              : online >= 2 && online <= 4
                ? "человека"
                : "человек"}
          </p>
        </div>
        {place.description && (
          <p className="mt-2 text-sm leading-6 text-[#b9b1c5]">{place.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {people.length === 0 ? (
            <p className="text-xs text-[#aaa4b7]">Пока пусто — будь первым здесь!</p>
          ) : (
            people.map((person) => (
              <Link
                className="border-white/8 flex items-center gap-1.5 rounded-full border bg-white/5 px-2.5 py-1 text-xs"
                href={`/u/${person.username}` as Route}
                key={person.id}
              >
                <span className="size-1.5 rounded-full bg-[#8df0b4]" />
                {person.display_name}
                {person.is_creator && " 👑"}
              </Link>
            ))
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <form action={enterPlace}>
            <input name="place_id" type="hidden" value={place.id} />
            <button
              className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
              type="submit"
            >
              Я здесь
            </button>
          </form>
          <form action={leavePlace}>
            <input name="place_id" type="hidden" value={place.id} />
            <button
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
              type="submit"
            >
              Выйти
            </button>
          </form>
          {!isMember && place.kind !== "fixed" && (
            <form action={joinPlace}>
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="rounded-xl border border-[#b550ff]/40 bg-[#1b1528] px-4 py-2 text-sm font-semibold text-[#e7c9f5]"
                type="submit"
              >
                Вступить
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-[#d68cff]" />
          <h2 className="font-bold">Общий разговор</h2>
        </div>
        <LivePlaceChat
          currentUserId={user.id}
          initialMessages={(messages ?? []).map((message) => ({
            id: message.id,
            author_id: message.author_id,
            body: message.body,
            created_at: message.created_at,
            author_name: names.get(message.author_id) ?? "Зритель",
          }))}
          placeId={place.id}
        />
      </section>
    </main>
  );
}
