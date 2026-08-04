"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import { parseAmountToMinor } from "@/lib/money";
import { optionalText, requiredText } from "@/lib/validation";

function newSlug() {
  return `f-${randomUUID().replaceAll("-", "")}`;
}

export async function createFundraiser(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = requiredText(formData.get("title"), 120);
  const description = optionalText(formData.get("description"), 5000);
  const targetAmountMinor = parseAmountToMinor(formData.get("target_amount"));
  const categorySlug = optionalText(formData.get("category_slug"), 40);
  const rawWishId = optionalText(formData.get("wish_id"), 100);
  const visibilityValue = formData.get("visibility");
  const visibility =
    visibilityValue === "private" || visibilityValue === "unlisted"
      ? visibilityValue
      : "public";
  const endsAtValue = optionalText(formData.get("ends_at"), 100);

  if (!title) throw new Error("Название сбора обязательно.");
  if (!targetAmountMinor || targetAmountMinor <= 0) {
    throw new Error("Укажите сумму цели больше нуля.");
  }

  let endsAt: string | null = null;
  if (endsAtValue) {
    const parsedDate = new Date(endsAtValue);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      throw new Error("Дата окончания должна быть в будущем.");
    }
    endsAt = parsedDate.toISOString();
  }

  let wishId: string | null = null;
  if (rawWishId) {
    const { data: wish } = await supabase
      .from("wishes")
      .select("id")
      .eq("id", rawWishId)
      .eq("author_id", user.id)
      .maybeSingle();
    if (!wish) throw new Error("Можно выбрать только собственное желание.");
    wishId = wish.id;
  }

  const cover = formData.get("cover_image");
  const coverImagePath = isUploadedFile(cover)
    ? await uploadOwnedImage({
        file: cover,
        ownerId: user.id,
        bucket: "fundraiser-media",
      })
    : null;
  const slug = newSlug();

  const { error } = await supabase.from("fundraisers").insert({
    author_id: user.id,
    wish_id: wishId,
    slug,
    title,
    description,
    cover_image_path: coverImagePath,
    category_slug: categorySlug,
    target_amount_minor: targetAmountMinor,
    currency: "RUB",
    visibility,
    status: "active",
    ends_at: endsAt,
    published_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Не удалось опубликовать сбор: ${error.message}`);

  revalidatePath("/");
  redirect(`/fundraisers/${slug}`);
}
