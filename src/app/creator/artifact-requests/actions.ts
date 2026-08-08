"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { optionalText, requiredText } from "@/lib/validation";

/** Sender: request a support artifact from a creator (charged on accept). */
export async function requestCreatorArtifact(formData: FormData) {
  const { supabase } = await requireUser();
  const creatorId = requiredText(formData.get("creator_id"), 100);
  const seriesId = requiredText(formData.get("series_id"), 100);
  const note = optionalText(formData.get("note"), 1000);
  const reason = optionalText(formData.get("reason"), 40) || null;
  if (!creatorId || !seriesId) throw new Error("Выберите предмет и автора.");

  const { error } = await supabase.rpc("request_creator_artifact", {
    p_creator_id: creatorId,
    p_series_id: seriesId,
    p_note: note ?? "",
    p_reason: reason,
  });
  if (error) throw new Error(`Не удалось отправить запрос: ${error.message}`);

  revalidatePath(`/u/${requiredText(formData.get("username"), 100)}`);
}

/** Creator: accept a request (mints instance, charges sender, credits ledger). */
export async function acceptArtifactRequest(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = requiredText(formData.get("request_id"), 100);
  if (!requestId) throw new Error("Запрос не найден.");

  const { error } = await supabase.rpc("accept_creator_artifact_request", {
    p_request_id: requestId,
  });
  if (error) throw new Error(`Не удалось принять: ${error.message}`);

  revalidatePath("/creator/artifact-requests");
}

/** Creator: reject a request (nothing minted or charged). */
export async function rejectArtifactRequest(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = requiredText(formData.get("request_id"), 100);
  if (!requestId) throw new Error("Запрос не найден.");

  const { error } = await supabase.rpc("reject_creator_artifact_request", {
    p_request_id: requestId,
  });
  if (error) throw new Error(`Не удалось отклонить: ${error.message}`);

  revalidatePath("/creator/artifact-requests");
}
