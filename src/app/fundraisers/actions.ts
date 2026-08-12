"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { awardCityPoints } from "@/lib/city-battle";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import { parseAmountToMinor } from "@/lib/money";
import { optionalText, requiredText } from "@/lib/validation";

function newSlug() {
  return `f-${randomUUID().replaceAll("-", "")}`;
}

export async function invitePrivateFundraiserMember(formData: FormData) {
  const { supabase } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  const fundraiserSlug = requiredText(formData.get("fundraiser_slug"), 100);
  const username = requiredText(formData.get("username"), 30).replace(/^@/, "");

  if (!fundraiserId || !fundraiserSlug || !username) {
    throw new Error("Укажите username пользователя для приглашения.");
  }

  const { data, error } = await supabase.rpc("invite_to_private_fundraiser", {
    p_fundraiser_id: fundraiserId,
    p_username: username,
  });

  if (error) throw new Error(`Не удалось отправить приглашение: ${error.message}`);

  const invitation = Array.isArray(data) ? data[0] : data;
  const message = invitation?.already_accepted
    ? "already-member"
    : `invited-${invitation?.username ?? username}`;

  revalidatePath(`/fundraisers/${fundraiserSlug}`);
  revalidatePath("/invitations");
  redirect(`/fundraisers/${fundraiserSlug}?invite=${encodeURIComponent(message)}`);
}

export type FundraiserActionState = { error?: string } | null;

export async function createFundraiser(
  _prev: FundraiserActionState,
  formData: FormData,
): Promise<FundraiserActionState> {
  try {
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

    if (!title) return { error: "Название сбора обязательно." };
    if (!targetAmountMinor || targetAmountMinor <= 0) {
      return { error: "Укажите сумму цели больше нуля." };
    }

    let endsAt: string | null = null;
    if (endsAtValue) {
      const parsedDate = new Date(endsAtValue);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        return { error: "Дата окончания должна быть в будущем." };
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
      if (!wish) return { error: "Можно выбрать только собственное желание." };
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

    const { data: fundraiser, error } = await supabase
      .from("fundraisers")
      .insert({
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
      })
      .select("id")
      .single();
    if (error) return { error: `Не удалось опубликовать сбор: ${error.message}` };

    // City battle: qualified action (fundraiser published).
    await awardCityPoints(supabase, "fundraiser_published", fundraiser?.id);

    revalidatePath("/");
    redirect(`/fundraisers/${slug}`);
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "Не получилось опубликовать сбор. Попробуй ещё раз.",
    };
  }
}
