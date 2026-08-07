"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireModerator } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

/** Suspend or restore a profile (moderator/admin; restore = admin only). */
export async function setSuspension(formData: FormData) {
  const { supabase } = await requireModerator();
  const profileId = requiredText(formData.get("profile_id"), 100);
  const suspended = formData.get("suspended") === "true";
  if (!profileId) throw new Error("Профиль не найден.");

  const { error } = await supabase.rpc("admin_set_suspension", {
    p_user_id: profileId,
    p_suspended: suspended,
  });
  if (error) throw new Error(`Не удалось изменить статус: ${error.message}`);

  revalidatePath("/admin/users");
  redirect(`/admin/users?q=${encodeURIComponent(formData.get("q")?.toString() ?? "")}`);
}

/** Assign or remove a moderator role (admin only). */
export async function setUserRole(formData: FormData) {
  const { supabase, role } = await requireModerator();
  if (role !== "admin") throw new Error("Только администратор может менять роли.");

  const profileId = requiredText(formData.get("profile_id"), 100);
  const newRole = requiredText(formData.get("role"), 20);
  if (!profileId || !["user", "moderator", "admin"].includes(newRole))
    throw new Error("Некорректные данные.");

  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: profileId,
    p_role: newRole,
  });
  if (error) throw new Error(`Не удалось изменить роль: ${error.message}`);

  revalidatePath("/admin/users");
  redirect(`/admin/users?q=${encodeURIComponent(formData.get("q")?.toString() ?? "")}`);
}
