"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
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
  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}` as Route);
}
