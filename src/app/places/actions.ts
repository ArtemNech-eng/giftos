"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalText, requiredText } from "@/lib/validation";

/** Invite a user (by username) into a personal/temporary place. */
export async function inviteToPlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const username = requiredText(formData.get("username"), 30)
    .replace(/^@/, "")
    .toLowerCase();
  if (!placeId || !username) throw new Error("Укажите пользователя.");

  const { data: place } = await supabase
    .from("places")
    .select("id, creator_id, name, emoji, kind")
    .eq("id", placeId)
    .eq("is_active", true)
    .maybeSingle();
  if (!place || place.kind === "fixed") throw new Error("Это место нельзя изменить.");
  if (place.creator_id !== user.id)
    throw new Error("Только создатель места может приглашать.");

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!target || target.id === user.id)
    throw new Error("Этот пользователь недоступен.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("place_members")
    .upsert(
      { place_id: place.id, profile_id: target.id, role: "member" },
      { onConflict: "place_id,profile_id" },
    );
  if (error) throw new Error(`Не удалось пригласить: ${error.message}`);

  await admin.from("notifications").insert({
    recipient_id: target.id,
    actor_id: user.id,
    type: "place_invite",
    entity_type: "place",
    entity_id: place.id,
    payload: { place_name: `${place.emoji} ${place.name}` },
  });

  revalidatePath(`/places/${place.id}`);
  redirect(`/places/${place.id}?invited=1` as Route);
}

/** Temporary places older than 24 hours become inactive (archived). */
export async function archiveTemporaryPlaces() {
  const { supabase } = await requireUser();
  await supabase
    .from("places")
    .update({ is_active: false })
    .eq("kind", "temporary")
    .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq("is_active", true);
  revalidatePath("/places");
}

export async function enterPlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  if (!placeId) return;

  const now = new Date().toISOString();
  await supabase.from("place_presence").upsert(
    {
      place_id: placeId,
      profile_id: user.id,
      entered_at: now,
      last_seen_at: now,
    },
    { onConflict: "place_id,profile_id" },
  );
  revalidatePath(`/places/${placeId}`);
}

export async function leavePlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  if (!placeId) return;

  await supabase
    .from("place_presence")
    .update({ last_seen_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() })
    .eq("place_id", placeId)
    .eq("profile_id", user.id);
  revalidatePath(`/places/${placeId}`);
}

export async function sendPlaceMessage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const body = requiredText(formData.get("body"), 2000);
  if (!placeId || !body) throw new Error("Введите сообщение.");

  const { error } = await supabase
    .from("place_messages")
    .insert({ place_id: placeId, author_id: user.id, body });
  if (error) throw new Error(`Не удалось отправить сообщение: ${error.message}`);

  // Sending a message is activity: refresh presence so the user stays online.
  await supabase.from("place_presence").upsert(
    {
      place_id: placeId,
      profile_id: user.id,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "place_id,profile_id" },
  );

  revalidatePath(`/places/${placeId}`);
  redirect(`/places/${placeId}` as Route);
}

export async function joinPlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  if (!placeId) return;

  await supabase
    .from("place_members")
    .upsert(
      { place_id: placeId, profile_id: user.id, role: "member" },
      { onConflict: "place_id,profile_id" },
    );
  revalidatePath(`/places/${placeId}`);
  redirect(`/places/${placeId}` as Route);
}

export async function createPlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = requiredText(formData.get("name"), 60);
  const description = optionalText(formData.get("description"), 500);
  const emoji = optionalText(formData.get("emoji"), 8) || "🏠";
  const kind = formData.get("kind") === "temporary" ? "temporary" : "personal";
  if (!name) throw new Error("Укажите название места.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.city_id) throw new Error("Сначала укажите город в профиле.");

  const { data: place, error } = await supabase
    .from("places")
    .insert({
      city_id: profile.city_id,
      creator_id: user.id,
      name,
      description,
      emoji,
      kind,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Не удалось создать место: ${error.message}`);

  await supabase
    .from("place_members")
    .insert({ place_id: place.id, profile_id: user.id, role: "creator" });
  await supabase.from("place_presence").insert({
    place_id: place.id,
    profile_id: user.id,
  });

  revalidatePath("/places");
  redirect(`/places/${place.id}` as Route);
}
