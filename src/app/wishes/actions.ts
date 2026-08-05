"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { awardCityPoints } from "@/lib/city-battle";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import { parseAmountToMinor } from "@/lib/money";
import { isValidUrl, optionalText, requiredText } from "@/lib/validation";

function wishInput(formData: FormData) {
  const title = requiredText(formData.get("title"), 120);
  const description = optionalText(formData.get("description"), 3000);
  const productUrl = optionalText(formData.get("product_url"), 2000);
  const estimatedCostMinor = parseAmountToMinor(formData.get("estimated_cost"));
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const categorySlug = optionalText(formData.get("category_slug"), 40);

  if (!title) throw new Error("Название желания обязательно.");
  if (!isValidUrl(productUrl)) throw new Error("Укажите корректную ссылку на товар.");
  if (formData.get("estimated_cost") && estimatedCostMinor === null) {
    throw new Error("Укажите корректную примерную стоимость.");
  }

  return {
    title,
    description,
    product_url: productUrl,
    estimated_cost_minor: estimatedCostMinor,
    visibility,
    category_slug: categorySlug,
  };
}

export async function createWish(formData: FormData) {
  const { supabase, user } = await requireUser();
  const input = wishInput(formData);
  const sourceWishId = optionalText(formData.get("source_wish_id"), 100);
  if (sourceWishId) {
    const { data: sourceWish } = await supabase
      .from("wishes")
      .select("id")
      .eq("id", sourceWishId)
      .eq("visibility", "public")
      .eq("is_archived", false)
      .maybeSingle();
    if (!sourceWish) throw new Error("Исходное желание недоступно.");
  }

  const image = formData.get("image");
  const imagePath = isUploadedFile(image)
    ? await uploadOwnedImage({ file: image, ownerId: user.id, bucket: "wish-media" })
    : null;

  const { data, error } = await supabase
    .from("wishes")
    .insert({
      ...input,
      author_id: user.id,
      image_path: imagePath,
      source_wish_id: sourceWishId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Не удалось создать желание: ${error.message}`);

  // A referral becomes active only after onboarding and a meaningful action.
  const { data: claimed } = await supabase.rpc("claim_referral_bonus_if_qualified");

  // City battle: qualified actions.
  await awardCityPoints(supabase, "wish_published", data.id);
  if (claimed === true) {
    await awardCityPoints(supabase, "referral_qualified", `referral-${user.id}`);
  }

  revalidatePath("/");
  redirect(`/wishes/${data.id}/edit`);
}

export async function updateWish(formData: FormData) {
  const { supabase, user } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);
  const input = wishInput(formData);
  if (!wishId) throw new Error("Не найдено желание для обновления.");

  const image = formData.get("image");
  const imagePath = isUploadedFile(image)
    ? await uploadOwnedImage({ file: image, ownerId: user.id, bucket: "wish-media" })
    : undefined;

  const { error } = await supabase
    .from("wishes")
    .update({ ...input, ...(imagePath ? { image_path: imagePath } : {}) })
    .eq("id", wishId)
    .eq("author_id", user.id);

  if (error) throw new Error(`Не удалось обновить желание: ${error.message}`);

  revalidatePath("/");
  revalidatePath(`/wishes/${wishId}`);
  redirect(`/wishes/${wishId}/edit?saved=1`);
}

export async function archiveWish(formData: FormData) {
  const { supabase, user } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);

  const { error } = await supabase
    .from("wishes")
    .update({ is_archived: true })
    .eq("id", wishId)
    .eq("author_id", user.id);
  if (error) throw new Error(`Не удалось архивировать желание: ${error.message}`);

  revalidatePath("/");
  redirect("/");
}

export async function toggleAlsoWantWish(formData: FormData) {
  const { supabase, user } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);
  if (!wishId) throw new Error("Желание не найдено.");

  const { data: wish } = await supabase
    .from("wishes")
    .select("id, visibility, is_archived")
    .eq("id", wishId)
    .maybeSingle();
  if (!wish || wish.visibility !== "public" || wish.is_archived)
    throw new Error("Это желание недоступно.");

  const { data: existing } = await supabase
    .from("wish_also_wants")
    .select("wish_id")
    .eq("wish_id", wishId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase
        .from("wish_also_wants")
        .delete()
        .eq("wish_id", wishId)
        .eq("profile_id", user.id)
    : await supabase
        .from("wish_also_wants")
        .insert({ wish_id: wishId, profile_id: user.id });
  if (error) throw new Error(`Не удалось обновить «Хочу также»: ${error.message}`);

  revalidatePath(`/wishes/${wishId}`);
  redirect(`/wishes/${wishId}` as Route);
}

export async function postWishComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);
  const body = requiredText(formData.get("body"), 2000);
  if (!wishId || !body) throw new Error("Введите сообщение для обсуждения.");

  const { data: wish } = await supabase
    .from("wishes")
    .select("id, visibility, is_archived")
    .eq("id", wishId)
    .maybeSingle();
  if (!wish || wish.visibility !== "public" || wish.is_archived)
    throw new Error("Это желание недоступно.");

  const { error } = await supabase.from("wish_comments").insert({
    wish_id: wishId,
    author_id: user.id,
    body,
  });
  if (error) throw new Error(`Не удалось отправить сообщение: ${error.message}`);

  revalidatePath(`/wishes/${wishId}`);
  redirect(`/wishes/${wishId}#discussion` as Route);
}

export async function cloneWish(formData: FormData) {
  const { supabase, user } = await requireUser();
  const sourceId = requiredText(formData.get("source_wish_id"), 100);

  const { data: source, error: sourceError } = await supabase
    .from("wishes")
    .select(
      "title, description, product_url, estimated_cost_minor, currency, category_slug",
    )
    .eq("id", sourceId)
    .eq("visibility", "public")
    .maybeSingle();
  if (sourceError || !source) throw new Error("Исходное желание недоступно.");

  const { data: created, error: createError } = await supabase
    .from("wishes")
    .insert({
      ...source,
      author_id: user.id,
      source_wish_id: sourceId,
      visibility: "public",
    })
    .select("id")
    .single();
  if (createError)
    throw new Error(`Не удалось создать похожее желание: ${createError.message}`);

  await supabase
    .from("wish_also_wants")
    .upsert(
      { wish_id: sourceId, profile_id: user.id },
      { onConflict: "wish_id,profile_id" },
    );

  redirect(`/wishes/${created.id}/edit`);
}
