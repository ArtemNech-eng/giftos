"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalText, requiredText } from "@/lib/validation";

export async function createLiveRoom(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = requiredText(formData.get("title"), 160);
  const description = optionalText(formData.get("description"), 1000);
  const category = optionalText(formData.get("category_slug"), 40);
  const wishId = optionalText(formData.get("wish_id"), 100);
  if (!title) throw new Error("Укажите название эфира.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_creator) throw new Error("Сначала создайте страницу автора.");

  const slug = `live-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const { data: room, error } = await supabase
    .from("live_rooms")
    .insert({
      host_id: user.id,
      slug,
      title,
      description,
      category_slug: category,
      wish_id: wishId,
      status: "live",
    })
    .select("id")
    .single();
  if (error || !room)
    throw new Error(
      `Не удалось создать room: ${error?.message ?? "неизвестная ошибка"}`,
    );
  await supabase
    .from("live_room_participants")
    .insert({ room_id: room.id, profile_id: user.id, role: "host" });
  await notifyFollowersAboutLiveRoom(user.id, room.id, slug, title);
  revalidatePath("/feed");
  redirect(`/live/${slug}` as Route);
}

async function notifyFollowersAboutLiveRoom(
  hostId: string,
  roomId: string,
  slug: string,
  title: string,
) {
  const admin = createAdminClient();
  const { data: followers } = await admin
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", hostId)
    .limit(200);
  if (!followers || followers.length === 0) return;

  // Skip followers who blocked the host: they must not receive anything.
  const followerIds = followers.map((item) => item.follower_id);
  const { data: blockedBy } = await admin
    .from("blocks")
    .select("blocker_id")
    .in("blocker_id", followerIds)
    .eq("blocked_id", hostId);
  const blockedSet = new Set((blockedBy ?? []).map((item) => item.blocker_id));
  const recipients = followerIds.filter((id) => !blockedSet.has(id));
  if (recipients.length === 0) return;

  await admin.from("notifications").insert(
    recipients.map((recipientId) => ({
      recipient_id: recipientId,
      actor_id: hostId,
      type: "live_started",
      entity_type: "live_room",
      entity_id: roomId,
      payload: { slug, title },
    })),
  );
}

export async function inviteLiveCohost(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  const username = requiredText(formData.get("username"), 30)
    .replace(/^@/, "")
    .toLowerCase();
  if (!roomId || !slug || !username)
    throw new Error("Укажите пользователя для совместного эфира.");

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, host_id, title")
    .eq("id", roomId)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!room) throw new Error("Только ведущий может приглашать co-host.");
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!target || target.id === user.id)
    throw new Error("Этот пользователь недоступен.");

  const admin = createAdminClient();
  const { error } = await admin.from("live_room_participants").upsert(
    {
      room_id: room.id,
      profile_id: target.id,
      role: "cohost",
      joined_at: new Date().toISOString(),
      left_at: null,
    },
    { onConflict: "room_id,profile_id" },
  );
  if (error) throw new Error(`Не удалось пригласить co-host: ${error.message}`);
  await admin.from("notifications").insert({
    recipient_id: target.id,
    actor_id: user.id,
    type: "live_cohost_invite",
    entity_type: "live_room",
    entity_id: room.id,
    payload: { slug, title: room.title },
  });

  revalidatePath(`/live/${slug}`);
  redirect(`/live/${slug}?cohost=invited` as Route);
}

export async function removeLiveCohost(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  const profileId = requiredText(formData.get("profile_id"), 100);
  if (!roomId || !slug || !profileId) throw new Error("Не удалось снять со-ведущего.");

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, host_id")
    .eq("id", roomId)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!room) throw new Error("Только ведущий может снять co-host.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("live_room_participants")
    .delete()
    .eq("room_id", room.id)
    .eq("profile_id", profileId)
    .eq("role", "cohost");
  if (error) throw new Error(`Не удалось снять co-host: ${error.message}`);

  revalidatePath(`/live/${slug}`);
  redirect(`/live/${slug}?cohost=removed` as Route);
}

export async function joinLiveRoom(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  if (!roomId || !slug) return;

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, status")
    .eq("id", roomId)
    .maybeSingle();
  if (!room || room.status !== "live") return;

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("live_room_participants")
    .select("role")
    .eq("room_id", room.id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) {
    // Keep the existing role (host/cohost/viewer), just mark presence.
    await supabase
      .from("live_room_participants")
      .update({ left_at: null, joined_at: now })
      .eq("room_id", room.id)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("live_room_participants")
      .insert({ room_id: room.id, profile_id: user.id, role: "viewer" });
  }
  revalidatePath(`/live/${slug}`);
}

export async function leaveLiveRoom(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  if (!roomId || !slug) return;

  await supabase
    .from("live_room_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("profile_id", user.id)
    .eq("role", "viewer");
  revalidatePath(`/live/${slug}`);
}

export async function endLiveRoom(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = requiredText(formData.get("slug"), 100);
  if (!slug) throw new Error("Эфир не указан.");
  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, host_id, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!room || room.host_id !== user.id)
    throw new Error("Только ведущий может завершить эфир.");
  if (room.status !== "live") throw new Error("Эфир уже завершён.");

  const { error } = await supabase
    .from("live_rooms")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", room.id);
  if (error) throw new Error(`Не удалось завершить эфир: ${error.message}`);

  revalidatePath(`/live/${slug}`);
  revalidatePath("/creator/dashboard");
  redirect(`/live/${slug}` as Route);
}
