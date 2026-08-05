"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

export async function promoteWishWithBonus(formData: FormData) {
  const { supabase } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);
  if (!wishId) throw new Error("Желание не найдено.");
  const { error } = await supabase.rpc("promote_wish_with_hocu_bonus", {
    p_wish_id: wishId,
  });
  if (error) throw new Error(`Не удалось продвинуть желание: ${error.message}`);
  revalidatePath("/feed");
  revalidatePath(`/wishes/${wishId}`);
  revalidatePath("/bonuses");
  redirect(`/wishes/${wishId}?promoted=1` as Route);
}
