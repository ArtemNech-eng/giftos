"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { optionalText, requiredText } from "@/lib/validation";

export async function activateCreatorPage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const headline = optionalText(formData.get("creator_headline"), 160);

  if (!username) throw new Error("Не удалось определить профиль автора.");

  const { error } = await supabase
    .from("profiles")
    .update({
      is_creator: true,
      creator_headline: headline,
    })
    .eq("id", user.id);
  if (error) throw new Error(`Не удалось создать страницу автора: ${error.message}`);

  revalidatePath("/");
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}
