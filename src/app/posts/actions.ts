"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

function slugify(value: string) {
  const base =
    value
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/[а-яё]/gi, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "post";
  return `${base}-${randomUUID().replaceAll("-", "").slice(0, 8)}`;
}

export async function createCreatorPost(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const title = requiredText(formData.get("title"), 160);
  const body = requiredText(formData.get("body"), 10000);
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  if (!username || !title || !body)
    throw new Error("Заполните заголовок и текст публикации.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_creator) throw new Error("Сначала создайте страницу автора.");

  const slug = slugify(title);
  const { error } = await supabase.from("creator_posts").insert({
    author_id: user.id,
    slug,
    title,
    body,
    visibility,
  });
  if (error) throw new Error(`Не удалось опубликовать пост: ${error.message}`);

  revalidatePath(`/u/${username}`);
  redirect(`/posts/${slug}` as Route);
}
