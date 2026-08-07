"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalText, requiredText } from "@/lib/validation";

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = requiredText(formData.get("title"), 120);
  const description = optionalText(formData.get("description"), 2000);
  const eventType = (
    ["meetup", "walk", "game", "concert", "stream", "other"].includes(
      String(formData.get("event_type")),
    )
      ? String(formData.get("event_type"))
      : "meetup"
  ) as "meetup" | "walk" | "game" | "concert" | "stream" | "other";
  const scope = formData.get("scope") === "open" ? "open" : "local";
  const startsAtRaw = String(formData.get("starts_at") ?? "");
  const startsAt = new Date(startsAtRaw);
  const placeId = optionalText(formData.get("place_id"), 100);

  if (!title) throw new Error("Укажите название события.");
  if (!startsAtRaw || Number.isNaN(startsAt.getTime()))
    throw new Error("Укажите дату и время начала.");
  if (startsAt.getTime() <= Date.now())
    throw new Error("Событие можно назначить только на будущее время.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (scope === "local" && !profile?.city_id)
    throw new Error("Сначала выберите город для локального события.");

  let verifiedPlaceId: string | null = null;
  if (placeId) {
    if (scope !== "local")
      throw new Error("Место можно привязать только к городскому событию.");
    const { data: place } = await supabase
      .from("places")
      .select("id, city_id, is_active")
      .eq("id", placeId)
      .maybeSingle();
    if (!place || !place.is_active || place.city_id !== profile?.city_id)
      throw new Error("Выберите действующее место из своего города.");
    verifiedPlaceId = place.id;
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      author_id: user.id,
      city_id: scope === "local" ? profile?.city_id : null,
      place_id: verifiedPlaceId,
      title,
      description,
      event_type: eventType,
      scope,
      starts_at: startsAt.toISOString(),
    })
    .select("id, city_id, scope, title, starts_at")
    .single();
  if (error) throw new Error(`Не удалось создать событие: ${error.message}`);

  // Notify: local events -> city residents; open events -> author's followers.
  await notifyAboutEvent({
    eventId: event.id,
    scope: event.scope,
    cityId: event.city_id,
    title: event.title,
    actorId: user.id,
    actorName: profile?.display_name ?? "Автор",
    startsAt: event.starts_at,
  });

  revalidatePath("/feed");
  revalidatePath("/places");
  if (verifiedPlaceId) revalidatePath(`/places/${verifiedPlaceId}`);
  revalidatePath("/events");
  redirect(`/events/${event.id}` as Route);
}

export async function joinEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const eventId = requiredText(formData.get("event_id"), 100);
  if (!eventId) throw new Error("Событие не найдено.");

  const { error } = await supabase
    .from("event_attendees")
    .insert({ event_id: eventId, profile_id: user.id });
  if (error && error.code !== "23505")
    throw new Error(`Не удалось присоединиться: ${error.message}`);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/places");
  redirect(`/events/${eventId}` as Route);
}

export async function leaveEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const eventId = requiredText(formData.get("event_id"), 100);
  if (!eventId) throw new Error("Событие не найдено.");

  await supabase
    .from("event_attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/places");
  redirect(`/events/${eventId}` as Route);
}

export async function cancelEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const eventId = requiredText(formData.get("event_id"), 100);
  if (!eventId) throw new Error("Событие не найдено.");

  const { data: event, error } = await supabase
    .from("events")
    .update({ is_cancelled: true })
    .eq("id", eventId)
    .eq("author_id", user.id)
    .select("id, title")
    .single();
  if (error) throw new Error(`Не удалось отменить событие: ${error.message}`);

  // Notify attendees that the event was cancelled.
  const admin = createAdminClient();
  const { data: attendees } = await admin
    .from("event_attendees")
    .select("profile_id")
    .eq("event_id", eventId);
  if (attendees && attendees.length > 0) {
    await admin.from("notifications").insert(
      attendees
        .filter((row) => row.profile_id !== user.id)
        .map((row) => ({
          recipient_id: row.profile_id,
          actor_id: user.id,
          type: "event_cancelled",
          entity_type: "event",
          entity_id: event.id,
          payload: { event_title: event.title },
        })),
    );
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/places");
  redirect(`/events/${eventId}` as Route);
}

async function notifyAboutEvent({
  eventId,
  scope,
  cityId,
  title,
  actorId,
  actorName,
  startsAt,
}: {
  eventId: string;
  scope: "local" | "open";
  cityId: string | null;
  title: string;
  actorId: string;
  actorName: string;
  startsAt: string;
}) {
  const admin = createAdminClient();

  if (scope === "local" && cityId) {
    // Local event: notify residents of the same city.
    const { data: residents } = await admin
      .from("profiles")
      .select("id")
      .eq("city_id", cityId)
      .eq("is_suspended", false)
      .limit(200);
    const residentIds = (residents ?? [])
      .map((row) => row.id)
      .filter((id) => id !== actorId);
    if (residentIds.length === 0) return;

    const { data: blockedBy } = await admin
      .from("blocks")
      .select("blocker_id")
      .in("blocker_id", residentIds)
      .eq("blocked_id", actorId);
    const blockedSet = new Set((blockedBy ?? []).map((row) => row.blocker_id));
    const recipients = residentIds.filter((id) => !blockedSet.has(id));
    if (recipients.length === 0) return;

    await admin.from("notifications").insert(
      recipients.map((recipientId) => ({
        recipient_id: recipientId,
        actor_id: actorId,
        type: "event_created",
        entity_type: "event",
        entity_id: eventId,
        payload: { event_title: title, scope: "local" },
      })),
    );
    const dateLabel = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(startsAt));
    await Promise.all(
      recipients.map((recipientId) =>
        sendPushToUser(recipientId, {
          title: `В вашем городе: ${title}`,
          body: `${actorName} · ${dateLabel}`,
          url: `/events/${eventId}`,
        }),
      ),
    );
  } else {
    // Open event: notify the author's followers.
    const { data: followers } = await admin
      .from("user_follows")
      .select("follower_id")
      .eq("following_id", actorId)
      .limit(200);
    if (!followers || followers.length === 0) return;
    const followerIds = followers.map((row) => row.follower_id);
    const { data: blockedBy } = await admin
      .from("blocks")
      .select("blocker_id")
      .in("blocker_id", followerIds)
      .eq("blocked_id", actorId);
    const blockedSet = new Set((blockedBy ?? []).map((row) => row.blocker_id));
    const recipients = followerIds.filter((id) => !blockedSet.has(id));
    if (recipients.length === 0) return;

    await admin.from("notifications").insert(
      recipients.map((recipientId) => ({
        recipient_id: recipientId,
        actor_id: actorId,
        type: "event_created",
        entity_type: "event",
        entity_id: eventId,
        payload: { event_title: title, scope: "open" },
      })),
    );
  }
}
