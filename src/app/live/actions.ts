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
  revalidatePath("/feed");
  redirect(`/live/${slug}` as Route);
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
