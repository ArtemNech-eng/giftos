"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import { requiredText } from "@/lib/validation";

export async function uploadProfileMedia(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const files = formData.getAll("photos").filter(isUploadedFile);

  if (!username || files.length === 0)
    throw new Error("Выберите хотя бы одну фотографию.");
  if (files.length > 6)
    throw new Error("За один раз можно добавить не более шести фотографий.");

  const { data: currentMedia, error: mediaError } = await supabase
    .from("profile_media")
    .select("id, sort_order")
    .eq("profile_id", user.id)
    .order("sort_order", { ascending: true });
  if (mediaError)
    throw new Error(`Не удалось проверить галерею: ${mediaError.message}`);

  const currentCount = currentMedia?.length ?? 0;
  if (currentCount + files.length > 6) {
    throw new Error(
      `В галерее может быть максимум шесть фотографий. Сейчас свободно: ${6 - currentCount}.`,
    );
  }

  const uploadedPaths = await Promise.all(
    files.map((file) =>
      uploadOwnedImage({ file, ownerId: user.id, bucket: "profile-media" }),
    ),
  );
  const { error: insertError } = await supabase.from("profile_media").insert(
    uploadedPaths.map((storage_path, index) => ({
      profile_id: user.id,
      storage_path,
      visibility,
      sort_order: currentCount + index,
    })),
  );

  if (insertError) {
    const admin = createAdminClient();
    await admin.storage.from("profile-media").remove(uploadedPaths);
    throw new Error(`Не удалось сохранить фотографии: ${insertError.message}`);
  }

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}

export async function deleteProfileMedia(formData: FormData) {
  const { supabase, user } = await requireUser();
  const mediaId = requiredText(formData.get("media_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  if (!mediaId || !username) throw new Error("Фотография не найдена.");

  const { data: media, error: findError } = await supabase
    .from("profile_media")
    .select("id, storage_path")
    .eq("id", mediaId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (findError || !media) throw new Error("Фотография недоступна для удаления.");

  const { error: deleteError } = await supabase
    .from("profile_media")
    .delete()
    .eq("id", media.id);
  if (deleteError)
    throw new Error(`Не удалось удалить фотографию: ${deleteError.message}`);

  const admin = createAdminClient();
  await admin.storage.from("profile-media").remove([media.storage_path]);

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}
