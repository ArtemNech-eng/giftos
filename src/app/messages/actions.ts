"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requiredText } from "@/lib/validation";

export async function sendDirectMessage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const conversationId = requiredText(formData.get("conversation_id"), 100);
  const body = requiredText(formData.get("body"), 2000);
  if (!conversationId || !body) throw new Error("Введите сообщение.");

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body });
  if (error) throw new Error(`Не удалось отправить сообщение: ${error.message}`);
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  const { data: members } = await supabase
    .from("conversation_members")
    .select("profile_id")
    .eq("conversation_id", conversationId);
  const recipients = (members ?? []).filter((member) => member.profile_id !== user.id);
  if (recipients.length > 0) {
    await createAdminClient()
      .from("notifications")
      .insert(
        recipients.map((member) => ({
          recipient_id: member.profile_id,
          actor_id: user.id,
          type: "direct_message",
          entity_type: "conversation",
          entity_id: conversationId,
          payload: { preview: body.slice(0, 120) },
        })),
      );
  }

  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}` as Route);
}
