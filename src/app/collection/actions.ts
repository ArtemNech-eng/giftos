"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requiredText } from "@/lib/validation";

/**
 * Sends a known, limited collectible artifact for ⭐. This is a platform
 * collection purchase, not a creator payout or a real-money transaction.
 */
export async function sendCollectibleArtifact(formData: FormData) {
  const { supabase, user } = await requireUser();
  const recipientId = requiredText(formData.get("recipient_id"), 100);
  const seriesId = requiredText(formData.get("series_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  if (!recipientId || !seriesId || !username)
    throw new Error("Выберите предмет и получателя.");

  const { data: instanceId, error } = await supabase.rpc("send_collectible_artifact", {
    p_recipient_id: recipientId,
    p_series_id: seriesId,
  });
  if (error || !instanceId)
    throw new Error(
      `Не удалось подарить артефакт: ${error?.message ?? "без экземпляра"}`,
    );

  // The recipient owns the reveal. This personal notification never becomes a
  // City Pulse event and does not disclose the sender on a public shelf.
  try {
    const { data: instance } = await supabase
      .from("collectible_artifact_instances")
      .select("serial_number, collectible_artifact_series!inner(title)")
      .eq("id", instanceId)
      .maybeSingle();
    const series = Array.isArray(instance?.collectible_artifact_series)
      ? (instance.collectible_artifact_series[0] ?? null)
      : instance?.collectible_artifact_series;
    await createAdminClient()
      .from("notifications")
      .insert({
        recipient_id: recipientId,
        actor_id: user.id,
        type: "collectible_artifact_received",
        entity_type: "collectible_artifact",
        entity_id: instanceId,
        payload: {
          artifact_title: series?.title ?? "артефакт",
          serial_number: instance?.serial_number ?? null,
        },
      });
  } catch {
    // Delivery notification must not undo a completed artifact allocation.
  }

  revalidatePath("/collection");
  revalidatePath("/bonuses");
  revalidatePath("/notifications");
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}?artifact=sent` as Route);
}

/** Marks a recipient's known artifact as revealed exactly once. */
export async function markCollectibleArtifactUnboxed(formData: FormData) {
  const { supabase } = await requireUser();
  const instanceId = requiredText(formData.get("instance_id"), 100);
  if (!instanceId) throw new Error("Артефакт не найден.");
  const { error } = await supabase.rpc("unbox_collectible_artifact", {
    p_instance_id: instanceId,
  });
  if (error) throw new Error(`Не удалось открыть артефакт: ${error.message}`);
  revalidatePath("/collection");
  revalidatePath(`/collection/unbox/${instanceId}`);
}
