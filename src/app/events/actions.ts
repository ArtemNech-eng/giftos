"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
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

  if (!title) throw new Error("Укажите название события.");
  if (!startsAtRaw || Number.isNaN(startsAt.getTime()))
    throw new Error("Укажите дату и время начала.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      author_id: user.id,
      city_id: scope === "local" ? (profile?.city_id ?? null) : null,
      title,
      description,
      event_type: eventType,
      scope,
      starts_at: startsAt.toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`Не удалось создать событие: ${error.message}`);

  revalidatePath("/feed");
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
  redirect(`/events/${eventId}` as Route);
}

export async function cancelEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const eventId = requiredText(formData.get("event_id"), 100);
  if (!eventId) throw new Error("Событие не найдено.");

  const { error } = await supabase
    .from("events")
    .update({ is_cancelled: true })
    .eq("id", eventId)
    .eq("author_id", user.id);
  if (error) throw new Error(`Не удалось отменить событие: ${error.message}`);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  redirect(`/events/${eventId}` as Route);
}
