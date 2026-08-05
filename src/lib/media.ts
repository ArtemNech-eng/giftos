import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type MediaBucket = "avatars" | "profile-media" | "wish-media" | "fundraiser-media";

export async function uploadOwnedImage({
  file,
  ownerId,
  bucket,
}: {
  file: File;
  ownerId: string;
  bucket: MediaBucket;
}) {
  if (!acceptedTypes.has(file.type)) {
    throw new Error("Поддерживаются только изображения JPG, PNG или WebP.");
  }

  const maxSize = bucket === "avatars" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Размер изображения превышает допустимый лимит.");
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${ownerId}/${randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Не удалось загрузить изображение: ${error.message}`);

  return path;
}

export async function getSignedImageUrl({
  bucket,
  path,
}: {
  bucket: MediaBucket;
  path: string | null | undefined;
}) {
  if (!path) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data.signedUrl;
  } catch {
    // Local UI remains usable before server-only Supabase credentials are added.
    return null;
  }
}

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}
