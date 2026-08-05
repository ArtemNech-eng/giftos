"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { finalizeSupport } from "@/lib/services/supports";
import { requiredText } from "@/lib/validation";

export async function confirmStubPayment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const supportId = requiredText(formData.get("support_id"), 100);
  if (!supportId) throw new Error("Тестовая поддержка не найдена.");

  const { data: support } = await supabase
    .from("fundraiser_supports")
    .select("id, fundraiser_id, supporter_id, provider, provider_payment_id, status")
    .eq("id", supportId)
    .eq("supporter_id", user.id)
    .maybeSingle();

  if (!support || support.provider !== "stub") {
    throw new Error("Тестовая поддержка недоступна.");
  }

  await finalizeSupport({
    supportId: support.id,
    status: "succeeded",
    payload: {
      test_mode: true,
      payment_id: support.provider_payment_id,
      confirmed_by: "supporter",
    },
  });

  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select("slug")
    .eq("id", support.fundraiser_id)
    .maybeSingle();
  if (!fundraiser) throw new Error("Сбор не найден после подтверждения поддержки.");

  revalidatePath("/");
  revalidatePath(`/fundraisers/${fundraiser.slug}`);
  redirect(`/fundraisers/${fundraiser.slug}?supported=1#discussion`);
}
