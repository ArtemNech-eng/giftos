"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalText, requiredText } from "@/lib/validation";

/** Invite the live room host into one of my places. */
export async function inviteLiveHostToPlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const hostId = requiredText(formData.get("host_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  if (!placeId || !hostId || hostId === user.id)
    throw new Error("Недостаточно данных.");

  const { data: place } = await supabase
    .from("places")
    .select("id, creator_id, name, emoji, kind")
    .eq("id", placeId)
    .eq("is_active", true)
    .maybeSingle();
  if (!place || place.kind === "fixed") throw new Error("Это место нельзя изменить.");
  if (place.creator_id !== user.id)
    throw new Error("Только создатель места может приглашать.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("place_members")
    .upsert(
      { place_id: place.id, profile_id: hostId, role: "member" },
      { onConflict: "place_id,profile_id" },
    );
  if (error) throw new Error(`Не удалось пригласить: ${error.message}`);

  await admin.from("notifications").insert({
    recipient_id: hostId,
    actor_id: user.id,
    type: "place_invite",
    entity_type: "place",
    entity_id: place.id,
    payload: { place_name: `${place.emoji} ${place.name}` },
  });

  revalidatePath(`/places/${place.id}`);
  redirect(`/live/${slug}?invited=1` as Route);
}

/** Invite a person (by profile id) into one of my places from their card. */
export async function inviteProfileToPlace(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const profileId = requiredText(formData.get("profile_id"), 100);
  const returnTo = requiredText(formData.get("return_to"), 200) || "/places";
  if (!placeId || !profileId || profileId === user.id)
    throw new Error("Недостаточно данных.");

  const { data: place } = await supabase
    .from("places")
    .select("id, creator_id, name, emoji, kind")
    .eq("id", placeId)
    .eq("is_active", true)
    .maybeSingle();
  if (!place || place.kind === "fixed") throw new Error("Это место нельзя изменить.");
  if (place.creator_id !== user.id)
    throw new Error("Только создатель места может приглашать.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("place_members")
    .upsert(
      { place_id: place.id, profile_id: profileId, role: "member" },
      { onConflict: "place_id,profile_id" },
    );
  if (error) throw new Error(`Не удалось пригласить: ${error.message}`);

  await admin.from("notifications").insert({
    recipient_id: profileId,
    actor_id: user.id,
    type: "place_invite",
    entity_type: "place",
    entity_id: place.id,
    payload: { place_name: `${place.emoji} ${place.name}` },
  });

  revalidatePath(`/places/${place.id}`);
  redirect(`${returnTo}?invited=1` as Route);
}

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

/** Boost the hangout: creator spends ⭐ to lift the place in the city list. */
export async function promotePlaceWithBonus(formData: FormData) {
  const { supabase } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  if (!placeId) throw new Error("Место не найдено.");
  const { error } = await supabase.rpc("promote_place_with_hocu_bonus", {
    p_place_id: placeId,
  });
  if (error) throw new Error(`Не удалось поднять тусовку: ${error.message}`);
  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/bonuses");
  redirect(`/places/${placeId}?promoted=1` as Route);
}

/** Pin the hangout: creator spends ⭐ to keep the place at the very top. */
export async function pinPlaceWithBonus(formData: FormData) {
  const { supabase } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  if (!placeId) throw new Error("Место не найдено.");
  const { error } = await supabase.rpc("pin_place_with_hocu_bonus", {
    p_place_id: placeId,
  });
  if (error) throw new Error(`Не удалось закрепить тусовку: ${error.message}`);
  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/bonuses");
  redirect(`/places/${placeId}?pinned=1` as Route);
}

/** Buy a theme for the place (creator only). */
export async function buyPlaceTheme(formData: FormData) {
  const { supabase } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const themeId = requiredText(formData.get("theme_id"), 100);
  if (!placeId || !themeId) throw new Error("Тема не найдена.");
  const { error } = await supabase.rpc("buy_place_theme", {
    p_place_id: placeId,
    p_theme_id: themeId,
  });
  if (error) throw new Error(`Не удалось купить тему: ${error.message}`);
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/bonuses");
  redirect(`/places/${placeId}?styled=1` as Route);
}

/** Buy an emblem for the place (creator only). */
export async function buyPlaceEmblem(formData: FormData) {
  const { supabase } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const emblemId = requiredText(formData.get("emblem_id"), 100);
  if (!placeId || !emblemId) throw new Error("Эмблема не найдена.");
  const { error } = await supabase.rpc("buy_place_emblem", {
    p_place_id: placeId,
    p_emblem_id: emblemId,
  });
  if (error) throw new Error(`Не удалось купить эмблему: ${error.message}`);
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/bonuses");
  redirect(`/places/${placeId}?styled=1` as Route);
}

/** Send a virtual gift to a person met in the place. */
export async function sendPlaceGift(formData: FormData) {
  const { supabase, user } = await requireUser();
  const placeId = requiredText(formData.get("place_id"), 100);
  const recipientId = requiredText(formData.get("recipient_id"), 100);
  const giftCode = requiredText(formData.get("gift_code"), 40);
  if (!placeId || !recipientId || !giftCode || recipientId === user.id)
    throw new Error("Выберите подарок.");

  const { data: gift } = await supabase
    .from("virtual_gifts")
    .select("code, price_minor, currency")
    .eq("code", giftCode)
    .eq("is_active", true)
    .maybeSingle();
  if (!gift) throw new Error("Подарок недоступен.");

  const admin = createAdminClient();
  const { data: sent, error } = await admin
    .from("place_gifts")
    .insert({
      place_id: placeId,
      sender_id: user.id,
      recipient_id: recipientId,
      gift_code: gift.code,
      price_minor: gift.price_minor,
      currency: gift.currency,
    })
    .select("id")
    .single();
  if (error || !sent)
    throw new Error(
      `Не удалось отправить подарок: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const gross = Number(gift.price_minor);
  const fee = Math.round(gross * 0.2);
  const { error: ledgerError } = await admin.from("creator_ledger_entries").insert({
    creator_id: recipientId,
    source_type: "gift",
    source_id: sent.id,
    gross_minor: gross,
    platform_fee_minor: fee,
    creator_net_minor: gross - fee,
    currency: gift.currency,
    status: "test",
  });
  if (ledgerError)
    throw new Error(`Не удалось начислить тестовый доход: ${ledgerError.message}`);

  await admin.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: user.id,
    type: "place_gift",
    entity_type: "place",
    entity_id: placeId,
    payload: { gift_label: gift.code, place_id: placeId },
  });

  revalidatePath(`/places/${placeId}`);
  redirect(`/places/${placeId}?gift=sent` as Route);
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
      last_read_at: now,
    },
    { onConflict: "place_id,profile_id" },
  );
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/places");
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
