"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

export async function buyItem(formData: FormData) {
  const { supabase } = await requireUser();
  const itemId = requiredText(formData.get("item_id"), 100);
  if (!itemId) throw new Error("Товар не найден.");
  const { error } = await supabase.rpc("purchase_virtual_item", {
    p_item_id: itemId,
  });
  if (error) throw new Error(`Не удалось купить: ${error.message}`);
  revalidatePath("/shop");
  revalidatePath("/bonuses");
  redirect("/shop?bought=1");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- server action signature requires the form
export async function buyVip(_formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("subscribe_vip");
  if (error) throw new Error(`Не удалось оформить VIP: ${error.message}`);
  revalidatePath("/shop");
  revalidatePath("/bonuses");
  redirect("/shop?vip=1");
}

export async function equipItem(formData: FormData) {
  const { supabase, user } = await requireUser();
  const itemId = requiredText(formData.get("item_id"), 100);
  if (!itemId) return;

  // Unequip everything, then equip the chosen item.
  await supabase
    .from("user_inventory")
    .update({ is_equipped: false })
    .eq("profile_id", user.id);
  await supabase
    .from("user_inventory")
    .update({ is_equipped: true })
    .eq("profile_id", user.id)
    .eq("item_id", itemId);

  revalidatePath("/shop");
  revalidatePath("/bonuses");
}

export async function sendProfileGift(formData: FormData) {
  const { supabase } = await requireUser();
  const recipientId = requiredText(formData.get("recipient_id"), 100);
  const giftCode = requiredText(formData.get("gift_code"), 40);
  const username = requiredText(formData.get("username"), 100);
  if (!recipientId || !giftCode || !username) throw new Error("Выберите подарок.");
  const { error } = await supabase.rpc("send_profile_gift", {
    p_recipient_id: recipientId,
    p_gift_code: giftCode,
  });
  if (error) throw new Error(`Не удалось отправить подарок: ${error.message}`);
  revalidatePath(`/u/${username}`);
  revalidatePath("/bonuses");
  redirect(`/u/${username}?gift=sent` as Route);
}

/** Promote a profile / live / event for stars (100% platform revenue). */
export async function promoteTarget(formData: FormData) {
  const { supabase } = await requireUser();
  const target = requiredText(formData.get("target"), 20);
  const targetId = requiredText(formData.get("target_id"), 100);
  const returnTo = requiredText(formData.get("return_to"), 200) || "/";
  if (!target || !targetId) throw new Error("Объект не найден.");
  const { error } = await supabase.rpc("promote_with_hocu_bonus", {
    p_target: target,
    p_target_id: targetId,
  });
  if (error) throw new Error(`Не удалось продвинуть: ${error.message}`);
  revalidatePath(returnTo);
  revalidatePath("/bonuses");
  redirect(`${returnTo}?promoted=1` as Route);
}
