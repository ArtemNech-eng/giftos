"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

/**
 * Sends a known, limited collectible artifact for ⭐. This is a platform
 * collection purchase, not a creator payout or a real-money transaction.
 */
export async function sendCollectibleArtifact(formData: FormData) {
  const { supabase } = await requireUser();
  const recipientId = requiredText(formData.get("recipient_id"), 100);
  const seriesId = requiredText(formData.get("series_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  if (!recipientId || !seriesId || !username)
    throw new Error("Выберите предмет и получателя.");

  const { error } = await supabase.rpc("send_collectible_artifact", {
    p_recipient_id: recipientId,
    p_series_id: seriesId,
  });
  if (error) throw new Error(`Не удалось подарить артефакт: ${error.message}`);

  revalidatePath("/collection");
  revalidatePath("/bonuses");
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}?artifact=sent` as Route);
}
