"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { isUploadedFile, uploadOwnedImage, deleteMediaFile } from "@/lib/media";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { optionalText, requiredText } from "@/lib/validation";

const MAX_PHOTOS = 3;

async function uploadServicePhotos(
  formData: FormData,
  ownerId: string,
): Promise<string[]> {
  const files = formData
    .getAll("photos")
    .filter((value): value is File => isUploadedFile(value))
    .slice(0, MAX_PHOTOS);
  const paths: string[] = [];
  for (const file of files) {
    paths.push(await uploadOwnedImage({ file, ownerId, bucket: "service-media" }));
  }
  return paths;
}

async function deleteServiceMedia(serviceId: string, paths: string[]) {
  for (const path of paths) {
    try {
      await deleteMediaFile({ bucket: "service-media", path });
    } catch {
      // Storage cleanup must never break the action.
    }
  }
  const { supabase } = await requireUser();
  await supabase.from("city_service_media").delete().eq("service_id", serviceId);
}

const validKinds = new Set(["service", "business"]);
const validCategories = new Set<string>(
  SERVICE_CATEGORIES.map((category) => category.slug),
);

export async function createService(formData: FormData) {
  const { supabase, user } = await requireUser();
  const kind = formData.get("kind") === "business" ? "business" : "service";
  const title = requiredText(formData.get("title"), 80);
  const categorySlug = requiredText(formData.get("category_slug"), 40);
  const description = optionalText(formData.get("description"), 1500);
  const contactText = optionalText(formData.get("contact_text"), 200);

  if (!validKinds.has(kind)) throw new Error("Выберите тип объявления.");
  if (!title) throw new Error("Укажите название.");
  if (!validCategories.has(categorySlug)) throw new Error("Выберите категорию.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.city_id) throw new Error("Сначала укажите город в профиле.");

  const { data: service, error } = await supabase
    .from("city_services")
    .insert({
      city_id: profile.city_id,
      owner_id: user.id,
      kind,
      title,
      category_slug: categorySlug,
      description,
      contact_text: contactText,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Не удалось создать объявление: ${error.message}`);

  const photoPaths = await uploadServicePhotos(formData, user.id);
  if (photoPaths.length > 0) {
    await supabase.from("city_service_media").insert(
      photoPaths.map((storage_path, index) => ({
        service_id: service.id,
        storage_path,
        sort_order: index,
      })),
    );
  }

  revalidatePath("/services");
  revalidatePath("/services/new");
  redirect(`/services/${service.id}`);
}

export async function updateService(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  const kind = formData.get("kind") === "business" ? "business" : "service";
  const title = requiredText(formData.get("title"), 80);
  const categorySlug = requiredText(formData.get("category_slug"), 40);
  const description = optionalText(formData.get("description"), 1500);
  const contactText = optionalText(formData.get("contact_text"), 200);

  if (!validKinds.has(kind)) throw new Error("Выберите тип объявления.");
  if (!title) throw new Error("Укажите название.");
  if (!validCategories.has(categorySlug)) throw new Error("Выберите категорию.");

  const { data: existing } = await supabase
    .from("city_services")
    .select("id")
    .eq("id", serviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!existing) throw new Error("Объявление не найдено.");

  const { error } = await supabase
    .from("city_services")
    .update({
      kind,
      title,
      category_slug: categorySlug,
      description,
      contact_text: contactText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);
  if (error) throw new Error(`Не удалось сохранить: ${error.message}`);

  // Replace photos only when new ones were provided.
  const photoPaths = await uploadServicePhotos(formData, user.id);
  if (photoPaths.length > 0) {
    const { data: oldMedia } = await supabase
      .from("city_service_media")
      .select("storage_path")
      .eq("service_id", serviceId);
    await deleteServiceMedia(
      serviceId,
      (oldMedia ?? []).map((row) => row.storage_path),
    );
    await supabase.from("city_service_media").insert(
      photoPaths.map((storage_path, index) => ({
        service_id: serviceId,
        storage_path,
        sort_order: index,
      })),
    );
  }

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  redirect(`/services/${serviceId}`);
}

export async function toggleServiceActive(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  const { data: existing } = await supabase
    .from("city_services")
    .select("id, is_active")
    .eq("id", serviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!existing) throw new Error("Объявление не найдено.");

  await supabase
    .from("city_services")
    .update({ is_active: !existing.is_active })
    .eq("id", serviceId);

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
}

export async function deleteService(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  const { data: existing } = await supabase
    .from("city_services")
    .select("id")
    .eq("id", serviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!existing) throw new Error("Объявление не найдено.");

  const { data: media } = await supabase
    .from("city_service_media")
    .select("storage_path")
    .eq("service_id", serviceId);
  await deleteServiceMedia(
    serviceId,
    (media ?? []).map((row) => row.storage_path),
  );

  await supabase.from("city_services").delete().eq("id", serviceId);

  revalidatePath("/services");
  redirect("/services");
}

export async function toggleServicePin(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  const { data: existing } = await supabase
    .from("city_services")
    .select("id, pinned_at")
    .eq("id", serviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!existing) throw new Error("Объявление не найдено.");

  if (existing.pinned_at) {
    await supabase
      .from("city_services")
      .update({ pinned_at: null })
      .eq("id", serviceId);
  } else {
    // One pinned listing per owner: unpin the rest, then pin this one.
    await supabase
      .from("city_services")
      .update({ pinned_at: null })
      .eq("owner_id", user.id)
      .neq("id", serviceId);
    await supabase
      .from("city_services")
      .update({ pinned_at: new Date().toISOString() })
      .eq("id", serviceId);
  }

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  revalidatePath("/services/mine");
}

export async function bumpService(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  const { data: existing } = await supabase
    .from("city_services")
    .select("id")
    .eq("id", serviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!existing) throw new Error("Объявление не найдено.");

  await supabase
    .from("city_services")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", serviceId);

  revalidatePath("/services");
  revalidatePath("/services/mine");
}
