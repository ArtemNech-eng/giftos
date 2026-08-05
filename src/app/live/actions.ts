"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
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

export async function sendLiveRoomMessage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  const body = requiredText(formData.get("body"), 2000);
  if (!roomId || !slug || !body) throw new Error("Введите сообщение.");
  const { error } = await supabase
    .from("live_room_messages")
    .insert({ room_id: roomId, author_id: user.id, body });
  if (error) throw new Error(`Не удалось отправить сообщение: ${error.message}`);
  revalidatePath(`/live/${slug}`);
  redirect(`/live/${slug}` as Route);
}
