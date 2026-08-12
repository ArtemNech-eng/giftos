"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { awardCityPoints } from "@/lib/city-battle";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import { parseAmountToMinor } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
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

export type WishActionState = { error?: string } | null;

export async function createWish(
  _prev: WishActionState,
  formData: FormData,
): Promise<WishActionState> {
  try {
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
      if (!sourceWish) return { error: "Исходное желание недоступно." };
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

    if (error) return { error: `Не удалось создать желание: ${error.message}` };

    // A referral becomes active only after onboarding and a meaningful action.
    const { data: claimed } = await supabase.rpc("claim_referral_bonus_if_qualified");

    // City battle: qualified actions.
    await awardCityPoints(supabase, "wish_published", data.id);
    if (claimed === true) {
      await awardCityPoints(supabase, "referral_qualified", `referral-${user.id}`);
    }

    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/wishes");
    revalidatePath("/places");
    redirect(`/wishes/${data.id}/edit`);
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "Не получилось создать желание. Попробуй ещё раз.",
    };
  }
}

export async function updateWish(
  _prev: WishActionState,
  formData: FormData,
): Promise<WishActionState> {
  try {
    const { supabase, user } = await requireUser();
    const wishId = requiredText(formData.get("wish_id"), 100);
    const input = wishInput(formData);
    if (!wishId) return { error: "Не найдено желание для обновления." };

    const image = formData.get("image");
    const removeImage = formData.get("remove_image") === "on";
    const imagePath = isUploadedFile(image)
      ? await uploadOwnedImage({ file: image, ownerId: user.id, bucket: "wish-media" })
      : removeImage
        ? null
        : undefined;

    const { error } = await supabase
      .from("wishes")
      .update({
        ...input,
        ...(imagePath !== undefined ? { image_path: imagePath } : {}),
      })
      .eq("id", wishId)
      .eq("author_id", user.id);

    if (error) return { error: `Не удалось обновить желание: ${error.message}` };

    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/wishes");
    revalidatePath(`/wishes/${wishId}`);
    redirect(`/wishes/${wishId}/edit?saved=1`);
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "Не получилось обновить желание. Попробуй ещё раз.",
    };
  }
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
  revalidatePath("/feed");
  revalidatePath("/wishes");
  redirect("/wishes");
}

export async function toggleAlsoWantWish(formData: FormData) {
  const { supabase, user } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);
  if (!wishId) throw new Error("Желание не найдено.");

  const { data: wish } = await supabase
    .from("wishes")
    .select("id, author_id, title, visibility, is_archived")
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

  // Notify the wish author when someone marks «Хочу также» (not on removal).
  if (!existing && wish.author_id !== user.id) {
    await createAdminClient()
      .from("notifications")
      .insert({
        recipient_id: wish.author_id,
        actor_id: user.id,
        type: "wish_also_want",
        entity_type: "wish",
        entity_id: wish.id,
        payload: { wish_title: wish.title },
      });
  }

  // Daily quest: supported a wish (only on add, not on removal).
  if (!existing) {
    await supabase.rpc("complete_daily_quest", { p_slug: "daily_wish_support" });
  }

  revalidatePath(`/wishes/${wishId}`);
  revalidatePath("/wishes");
  redirect(`/wishes/${wishId}` as Route);
}

/**
 * Feed version of the «Хочу также» toggle: updates the count via the DB
 * trigger and refreshes the feed in place, without navigating away.
 */
export async function toggleAlsoWantWishFromFeed(formData: FormData) {
  const { supabase, user } = await requireUser();
  const wishId = requiredText(formData.get("wish_id"), 100);
  if (!wishId) return;

  const { data: wish } = await supabase
    .from("wishes")
    .select("id, visibility, is_archived")
    .eq("id", wishId)
    .maybeSingle();
  if (!wish || wish.visibility !== "public" || wish.is_archived) return;

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

  // Daily quest: supported a wish (only on add, not on removal).
  if (!existing) {
    await supabase.rpc("complete_daily_quest", { p_slug: "daily_wish_support" });
  }

  revalidatePath("/feed");
  revalidatePath("/wishes");
  revalidatePath(`/wishes/${wishId}`);
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
  if (error?.message.includes("comment_rate_limit"))
    throw new Error("Слишком много сообщений — подождите минуту.");
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

  revalidatePath("/feed");
  revalidatePath("/wishes");
  redirect(`/wishes/${created.id}/edit`);
}
