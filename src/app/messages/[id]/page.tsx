/* eslint-disable @next/next/no-img-element -- avatars use short-lived signed Storage URLs */
import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { LiveConversationRefresh } from "@/components/live-conversation-refresh";
import { MessageComposer } from "@/components/message-composer";
import { LocalRoleIcon } from "@/components/local-role-icon";
import { PlaceInviteButton } from "@/components/place-invite-button";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

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

  const [{ data: messages }, { data: otherMembers }, { data: myPlaces }] =
    await Promise.all([
      supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("conversation_members")
        .select("profile_id")
        .eq("conversation_id", id)
        .neq("profile_id", user.id)
        .limit(1),
      supabase
        .from("places")
        .select("id, name, icon_code")
        .eq("creator_id", user.id)
        .eq("is_active", true)
        .neq("kind", "fixed")
        .limit(20),
    ]);
  const otherId = otherMembers?.[0]?.profile_id ?? null;
  const senderIds = [...new Set((messages ?? []).map((item) => item.sender_id))];
  const [{ data: profiles }, { data: other }, { data: localCreator }] =
    await Promise.all([
      senderIds.length
        ? supabase.from("profiles").select("id, display_name").in("id", senderIds)
        : Promise.resolve({ data: [] }),
      otherId
        ? supabase
            .from("profiles")
            .select(
              "id, username, display_name, avatar_path, city, show_city, profile_visibility",
            )
            .eq("id", otherId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      otherId
        ? supabase
            .from("public_local_creators")
            .select("role_code, city_label, headline")
            .eq("id", otherId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const otherAvatarUrl = await getSignedImageUrl({
    bucket: "avatars",
    path: other?.avatar_path,
  });
  const nameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#f7f4fb] px-4 pb-5 pt-5 text-[#251d31]">
      <LiveConversationRefresh conversationId={id} />
      <header className="flex items-center gap-3">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,.08)]"
          href="/messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link
          className="flex min-w-0 grow items-center gap-2.5"
          href={other?.username ? `/u/${other.username}` : "/messages"}
        >
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff78ad] to-[#8753ed] p-0.5">
            <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f7f1fa] text-xs font-black text-[#33263d]">
              {otherAvatarUrl ? (
                <img
                  loading="lazy"
                  decoding="async"
                  alt=""
                  className="size-full object-cover"
                  src={otherAvatarUrl}
                />
              ) : (
                (other?.display_name ?? "Д").slice(0, 1).toUpperCase()
              )}
            </span>
          </span>
          <span className="min-w-0">
            <b className="block truncate text-sm">
              {other?.display_name ?? "Личный диалог"}
            </b>
            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[#81748a]">
              {localCreator && (
                <LocalRoleIcon
                  className="size-3.5 text-[#8753e6]"
                  code={localCreator.role_code}
                />
              )}
              {localCreator?.city_label ??
                (other?.show_city ? other.city : "Личный диалог")}
            </span>
          </span>
        </Link>
        {otherId && (myPlaces ?? []).length > 0 && (
          <PlaceInviteButton
            places={(myPlaces ?? []).map((place) => ({
              id: place.id,
              name: place.name,
              icon_code: place.icon_code,
            }))}
            profileId={otherId}
            returnTo={`/messages/${id}`}
          />
        )}
      </header>

      {localCreator && (
        <section className="mt-4 flex items-center gap-3 rounded-2xl border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white text-[#8753e6]">
            <LocalRoleIcon className="size-4" code={localCreator.role_code} />
          </span>
          <span className="min-w-0 grow">
            <b className="block text-[10px]">Создаёт в городе</b>
            <small className="block truncate text-[10px] text-[#756a7d]">
              {localCreator.headline ??
                localCreator.city_label ??
                "Открыть профиль автора"}
            </small>
          </span>
          {other?.show_city && other.city && (
            <Link className="text-[10px] font-black text-[#8753e6]" href="/places">
              <MapPin className="inline size-3" /> Город
            </Link>
          )}
        </section>
      )}

      <section className="mt-5 grow space-y-3">
        {(messages ?? []).length === 0 ? (
          <div className="mt-16 rounded-[1.8rem] border border-dashed border-[#2c2036]/20 bg-white/70 p-6 text-center">
            <MessageCircle className="mx-auto size-7 text-[#8753e6]" />
            <h1 className="mt-4 text-lg font-black">Разговор начинается здесь</h1>
            <p className="mt-2 text-[11px] leading-5 text-[#7b7083]">
              Личный диалог остаётся личным: он не появится в City Pulse и не станет
              публичным моментом.
            </p>
          </div>
        ) : (
          (messages ?? []).map((message) => {
            const mine = message.sender_id === user.id;
            return (
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-3 text-sm leading-6 shadow-[0_5px_14px_rgba(69,43,94,.05)] ${
                  mine
                    ? "ml-auto bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] text-white"
                    : "border border-[#2c2036]/10 bg-white text-[#30253a]"
                }`}
                key={message.id}
              >
                <b
                  className={`mb-1 flex items-center justify-between gap-2 text-[10px] ${mine ? "text-white/75" : "text-[#8753e6]"}`}
                >
                  {mine ? "Вы" : (nameById.get(message.sender_id) ?? "Собеседник")}
                  <span
                    className={`font-semibold ${mine ? "text-white/55" : "text-[#a093a6]"}`}
                  >
                    {timeFormatter.format(new Date(message.created_at))}
                  </span>
                </b>
                {message.body}
              </div>
            );
          })
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-[#c8e5e1] bg-[#f1faf8] p-3 text-[10px] leading-5 text-[#52736f]">
        <span className="flex items-center gap-1.5 font-black text-[#258b82]">
          <ShieldCheck className="size-3.5" /> Личный разговор
        </span>
        <span className="mt-1 block">
          Сообщения видны только участникам этого диалога. Публичные городские моменты
          появляются только по отдельному opt-in.
        </span>
      </section>

      <MessageComposer conversationId={id} />
    </main>
  );
}
