import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureDirectConversation(
  firstUserId: string,
  secondUserId: string,
) {
  const [userLowId, userHighId] = [firstUserId, secondUserId].sort();
  const directKey = `${userLowId}:${userHighId}`;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("direct_key", directKey)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: conversation, error } = await admin
    .from("conversations")
    .insert({ type: "direct", direct_key: directKey, created_by: firstUserId })
    .select("id")
    .single();
  if (error || !conversation)
    throw new Error(
      `Не удалось создать диалог: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const { error: membersError } = await admin.from("conversation_members").insert([
    { conversation_id: conversation.id, profile_id: firstUserId },
    { conversation_id: conversation.id, profile_id: secondUserId },
  ]);
  if (membersError)
    throw new Error(`Не удалось добавить участников диалога: ${membersError.message}`);
  return conversation.id;
}
