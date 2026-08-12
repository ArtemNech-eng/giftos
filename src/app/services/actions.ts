"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { optionalText, requiredText } from "@/lib/validation";

const validKinds = new Set(["service", "business"]);
const validCategories = new Set<string>(SERVICE_CATEGORIES.map((category) => category.slug));

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

  await supabase.from("city_services").delete().eq("id", serviceId);

  revalidatePath("/services");
  redirect("/services");
}
