import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedVideoTypes = new Set(["video/mp4", "video/webm"]);

type MediaBucket =
  | "avatars"
  | "profile-media"
  | "wish-media"
  | "fundraiser-media"
  | "story-media"
  | "service-media";

export async function uploadOwnedImage({
  file,
  ownerId,
  bucket,
}: {
  file: File;
  ownerId: string;
  bucket: Exclude<MediaBucket, "story-media">;
}) {
  if (!acceptedImageTypes.has(file.type))
    throw new Error("Поддерживаются только изображения JPG, PNG или WebP.");
  const maxSize = bucket === "avatars" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize)
    throw new Error("Размер изображения превышает допустимый лимит.");

  return uploadMediaFile({ file, ownerId, bucket });
}

export async function uploadOwnedStoryVideo({
  file,
  ownerId,
}: {
  file: File;
  ownerId: string;
}) {
  if (!acceptedVideoTypes.has(file.type))
    throw new Error("Для stories поддерживаются видео MP4 или WebM.");
  if (file.size > 50 * 1024 * 1024)
    throw new Error("Размер video story не должен превышать 50 МБ.");

  return uploadMediaFile({ file, ownerId, bucket: "story-media" });
}

async function uploadMediaFile({
  file,
  ownerId,
  bucket,
}: {
  file: File;
  ownerId: string;
  bucket: MediaBucket;
}) {
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${ownerId}/${randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Не удалось загрузить файл: ${error.message}`);
  return path;
}

// In-process signed URL cache. Signed Storage URLs are valid for an hour,
// so regenerating them on every render (49+ calls per page) is pure waste.
// A short TTL keeps the cache warm across renders while never outliving the
// URL validity window. One instance = one cache; fine for the launch stage.
const SIGNED_URL_TTL_MS = 50 * 60 * 1000;
const signedUrlCache = new Map<string, { url: string | null; expiresAt: number }>();

export async function getSignedImageUrl({
  bucket,
  path,
}: {
  bucket: MediaBucket;
  path: string | null | undefined;
}) {
  if (!path) return null;
  const key = `${bucket}:${path}`;
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    const url = error ? null : data.signedUrl;
    signedUrlCache.set(key, { url, expiresAt: Date.now() + SIGNED_URL_TTL_MS });
    return url;
  } catch {
    return null;
  }
}

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function deleteMediaFile({
  bucket,
  path,
}: {
  bucket: MediaBucket;
  path: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Не удалось удалить файл: ${error.message}`);
}
