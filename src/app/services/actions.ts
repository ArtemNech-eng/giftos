"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { isUploadedFile, uploadOwnedImage, deleteMediaFile } from "@/lib/media";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { optionalText, requiredText } from "@/lib/validation";

const MAX_PHOTOS = 3;
const MAX_CATALOG_ITEMS = 8;

function readHours(formData: FormData) {
  const days: Array<
    { day: number; open: string; close: string } | { day: number; closed: true }
  > = [];
  for (let day = 0; day < 7; day += 1) {
    const open = String(formData.get(`hours_open_${day}`) ?? "").trim();
    const close = String(formData.get(`hours_close_${day}`) ?? "").trim();
    if (open && close) {
      days.push({ day, open, close });
    } else {
      days.push({ day, closed: true });
    }
  }
  return days;
}

function readCatalogItems(formData: FormData) {
  const titles = formData.getAll("item_title").map(String).slice(0, MAX_CATALOG_ITEMS);
  const prices = formData.getAll("item_price").map(String).slice(0, MAX_CATALOG_ITEMS);
  const items: Array<{ title: string; price: string }> = [];
  for (let i = 0; i < titles.length; i += 1) {
    const title = titles[i]?.trim() ?? "";
    const price = prices[i]?.trim() ?? "";
    if (title && price) items.push({ title, price });
  }
  return items;
}

async function replaceCatalogItems(
  serviceId: string,
  items: Array<{ title: string; price: string }>,
) {
  const { supabase } = await requireUser();
  await supabase.from("service_catalog_items").delete().eq("service_id", serviceId);
  if (items.length > 0) {
    await supabase.from("service_catalog_items").insert(
      items.map((item, index) => ({
        service_id: serviceId,
        title: item.title.slice(0, 120),
        price: item.price.slice(0, 40),
        sort_order: index,
      })),
    );
  }
}

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

export type ServiceActionState = { error?: string } | null;

export async function createService(
  _prev: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  try {
    const { supabase, user } = await requireUser();
    const kind = formData.get("kind") === "business" ? "business" : "service";
    const title = requiredText(formData.get("title"), 80);
    const categorySlug = requiredText(formData.get("category_slug"), 40);
    const description = optionalText(formData.get("description"), 1500);
    const contactText = optionalText(formData.get("contact_text"), 200);

    if (!validKinds.has(kind)) return { error: "Выберите тип объявления." };
    if (!title) return { error: "Укажите название." };
    if (!validCategories.has(categorySlug)) return { error: "Выберите категорию." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("city_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.city_id) return { error: "Сначала укажите город в профиле." };

    const address = optionalText(formData.get("address"), 200);
    const hours = kind === "business" ? readHours(formData) : null;
    const catalogItems = readCatalogItems(formData);

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
        address: address || null,
        hours: hours ? JSON.stringify(hours) : null,
      })
      .select("id")
      .single();
    if (error) return { error: `Не удалось создать объявление: ${error.message}` };

    await replaceCatalogItems(service.id, catalogItems);

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
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "Не получилось создать объявление. Попробуй ещё раз.",
    };
  }
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

  const address = optionalText(formData.get("address"), 200);
  const hours = kind === "business" ? readHours(formData) : null;
  const catalogItems = readCatalogItems(formData);

  const { error } = await supabase
    .from("city_services")
    .update({
      kind,
      title,
      category_slug: categorySlug,
      description,
      contact_text: contactText,
      address: address || null,
      hours: hours ? JSON.stringify(hours) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);
  if (error) throw new Error(`Не удалось сохранить: ${error.message}`);

  await replaceCatalogItems(serviceId, catalogItems);

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
  await supabase.from("service_catalog_items").delete().eq("service_id", serviceId);

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

export async function addServiceReview(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  const rawRating = Number(formData.get("rating"));
  const body = optionalText(formData.get("body"), 1000);

  if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5)
    throw new Error("Поставьте оценку от 1 до 5.");

  const { data: service } = await supabase
    .from("city_services")
    .select("id, owner_id")
    .eq("id", serviceId)
    .eq("is_active", true)
    .maybeSingle();
  if (!service) throw new Error("Объявление не найдено.");
  if (service.owner_id === user.id)
    throw new Error("Нельзя оставить отзыв на собственное объявление.");

  const { error } = await supabase.from("service_reviews").insert({
    service_id: serviceId,
    author_id: user.id,
    rating: rawRating,
    body: body || null,
  });
  if (error) {
    if (error.code === "23505")
      throw new Error("Вы уже оставили отзыв на это объявление.");
    throw new Error(`Не удалось отправить отзыв: ${error.message}`);
  }

  revalidatePath(`/services/${serviceId}`);
}

export async function deleteServiceReview(formData: FormData) {
  const { supabase, user } = await requireUser();
  const reviewId = requiredText(formData.get("review_id"), 100);
  const { data: review } = await supabase
    .from("service_reviews")
    .select("id, service_id")
    .eq("id", reviewId)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!review) throw new Error("Отзыв не найден.");

  await supabase.from("service_reviews").delete().eq("id", reviewId);
  revalidatePath(`/services/${review.service_id}`);
}

export async function replyToServiceReview(formData: FormData) {
  const { supabase } = await requireUser();
  const reviewId = requiredText(formData.get("review_id"), 100);
  const reply = requiredText(formData.get("reply"), 1000);
  if (!reply) throw new Error("Введите ответ.");

  const { data: ok } = await supabase.rpc("reply_to_service_review", {
    p_review_id: reviewId,
    p_reply: reply,
  });
  if (!ok) throw new Error("Ответить может только владелец объявления.");

  const { data: review } = await supabase
    .from("service_reviews")
    .select("service_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (review) revalidatePath(`/services/${review.service_id}`);
}

export async function toggleServiceDemand(formData: FormData) {
  const { supabase } = await requireUser();
  const serviceId = requiredText(formData.get("service_id"), 100);
  await supabase.rpc("toggle_service_demand", {
    p_service_id: serviceId,
  });
  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  revalidatePath("/services/mine");
}

export async function toggleCategoryDemand(formData: FormData) {
  const { supabase } = await requireUser();
  const categorySlug = requiredText(formData.get("category_slug"), 40);
  await supabase.rpc("toggle_category_demand", {
    p_category_slug: categorySlug,
  });
  revalidatePath("/services");
}
