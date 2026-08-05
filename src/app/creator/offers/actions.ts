"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { parseAmountToMinor } from "@/lib/money";
import { optionalText, requiredText } from "@/lib/validation";

const kinds = new Set([
  "message",
  "voice_call",
  "video_call",
  "game",
  "activity",
  "co_stream",
  "custom",
]);

export async function createCreatorOffer(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const kind = requiredText(formData.get("kind"), 40);
  const title = requiredText(formData.get("title"), 80);
  const description = optionalText(formData.get("description"), 300);
  const price = parseAmountToMinor(formData.get("price"));
  if (!username || !kinds.has(kind) || !title || !price || price <= 0)
    throw new Error("Заполните формат, название и цену действия.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_creator) throw new Error("Сначала создайте страницу автора.");
  const { count } = await supabase
    .from("creator_offers")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user.id);
  if ((count ?? 0) >= 6) throw new Error("Можно добавить максимум шесть действий.");

  const { error } = await supabase.from("creator_offers").insert({
    creator_id: user.id,
    kind,
    title,
    description,
    price_minor: price,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(`Не удалось добавить действие: ${error.message}`);

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}
