import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- signed Storage URLs */
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  Flame,
  Pencil,
  Pin,
  Sparkles,
} from "lucide-react";
import { notFound } from "next/navigation";

import {
  bumpService,
  deleteService,
  toggleServiceActive,
  toggleServicePin,
} from "@/app/services/actions";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";
import { SERVICE_KIND_LABELS, serviceCategory } from "@/lib/service-categories";

export const metadata = {
  title: "Объявление",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ServiceDetail = {
  id: string;
  city_id: string;
  owner_id: string;
  kind: "service" | "business";
  title: string;
  category_slug: string;
  description: string | null;
  contact_text: string | null;
  created_at: string;
  views_count: number;
  pinned_at: string | null;
  owner_username: string;
  owner_display_name: string;
  owner_avatar_path: string | null;
  cover_path: string | null;
};

export default async function ServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: rawService } = await supabase
    .from("public_city_services")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const service = rawService as ServiceDetail | null;
  if (!service) notFound();

  // The owner also needs the live is_active flag (own row, RLS allows it).
  const { data: ownRow } = await supabase
    .from("city_services")
    .select("is_active")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  const isActive = ownRow ? (ownRow.is_active as boolean) : true;

  const isOwner = service.owner_id === user.id;
  const category = serviceCategory(service.category_slug);

  const { data: rawMedia } = await supabase
    .from("city_service_media")
    .select("id, storage_path, sort_order")
    .eq("service_id", id)
    .order("sort_order", { ascending: true })
    .limit(3);
  const media = await Promise.all(
    (
      (rawMedia ?? []) as Array<{
        id: string;
        storage_path: string;
        sort_order: number;
      }>
    ).map(async (item) => ({
      ...item,
      url: await getSignedImageUrl({
        bucket: "service-media",
        path: item.storage_path,
      }),
    })),
  );
  const ownerAvatar = await getSignedImageUrl({
    bucket: "avatars",
    path: service.owner_avatar_path,
  });
  const isPinned = Boolean(service.pinned_at);

  // Count a view (skip the owner's own visits).
  if (!isOwner) {
    try {
      await supabase.rpc("record_service_view", { p_service_id: id });
    } catch {
      // Counting must never break the page.
    }
  }
  const createdAt = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(service.created_at));

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к объявлениям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/services"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская витрина
          </small>
          <h1 className="mt-0.5 text-sm font-black">
            {SERVICE_KIND_LABELS[service.kind]}
          </h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <ServiceCategoryIcon
            className="size-4.5"
            code={category?.iconCode ?? "store"}
          />
        </span>
      </header>

      {media.length > 0 && (
        <section className="border-[#2c2036]/9 mt-5 overflow-hidden rounded-[1.7rem] border bg-white shadow-[0_14px_32px_rgba(69,43,94,.08)]">
          <div className="relative">
            { }
            <img
              alt={service.title}
              className="aspect-[4/3] w-full object-cover"
              decoding="async"
              src={media[0].url ?? ""}
            />
            {isPinned && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#201827]/85 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur">
                <Pin className="size-3" /> Закреплено
              </span>
            )}
            {isOwner && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black text-[#5f5369] backdrop-blur">
                <Eye className="size-3" /> {service.views_count}
              </span>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2 p-2">
              {media.map((photo) => (
                 
                <img
                  alt=""
                  className="size-16 rounded-xl object-cover"
                  decoding="async"
                  key={photo.id}
                  src={photo.url ?? ""}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <article className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_14px_32px_rgba(69,43,94,.08)]">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black ${
              service.kind === "business"
                ? "bg-[#fff6d9] text-[#a87511]"
                : "bg-[#f0e9ff] text-[#7549d0]"
            }`}
          >
            {SERVICE_KIND_LABELS[service.kind]}
          </span>
          {isPinned && !media.length && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#201827] px-2 py-1 text-[9px] font-black text-white">
              <Pin className="size-3" /> Закреплено
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f0faf5] px-2 py-1 text-[9px] font-black text-[#258b82]">
            <Eye className="size-3" /> {service.views_count} просмотров
          </span>
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.06em]">{service.title}</h2>
        {category && (
          <p className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-[#8753e6]">
            <ServiceCategoryIcon className="size-3.5" code={category.iconCode} />
            {category.label}
          </p>
        )}
        {service.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#5f5369]">
            {service.description}
          </p>
        )}
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#fbf9fe] p-2.5">
          <Link
            className="flex min-w-0 grow items-center gap-2"
            href={`/u/${service.owner_username}` as Route}
          >
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] text-xs font-black text-white">
              {ownerAvatar ? (
                <img
                  alt=""
                  className="size-full object-cover"
                  decoding="async"
                  src={ownerAvatar}
                />
              ) : (
                service.owner_display_name.slice(0, 1).toUpperCase()
              )}
            </span>
            <span className="min-w-0">
              <b className="block truncate text-[11px]">{service.owner_display_name}</b>
              <small className="block text-[9px] text-[#81748a]">
                @{service.owner_username} · {createdAt}
              </small>
            </span>
          </Link>
          <ChevronRight className="size-4 shrink-0 text-[#a295a8]" />
        </div>
        {service.contact_text && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#f0e9ff] px-3 py-2.5 text-[11px] font-black text-[#7549d0]">
            <Sparkles className="size-3.5" /> {service.contact_text}
          </p>
        )}
      </article>

      {isOwner ? (
        <section className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <form action={toggleServicePin}>
              <input name="service_id" type="hidden" value={service.id} />
              <button
                className={`flex w-full items-center justify-center gap-1.5 rounded-2xl border py-3 text-xs font-black ${
                  isPinned
                    ? "border-[#201827] bg-[#201827] text-white"
                    : "border-[#2c2036]/10 bg-white text-[#5f5369]"
                }`}
                type="submit"
              >
                <Pin className="size-3.5" /> {isPinned ? "Открепить" : "Закрепить"}
              </button>
            </form>
            <form action={bumpService}>
              <input name="service_id" type="hidden" value={service.id} />
              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#2c2036]/10 bg-white py-3 text-xs font-black text-[#5f5369]"
                type="submit"
              >
                <Flame className="size-3.5 text-[#e2574c]" /> Поднять
              </button>
            </form>
          </div>
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-xs font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
            href={`/services/${service.id}/edit`}
          >
            <Pencil className="size-4" /> Редактировать
          </Link>
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#2c2036]/10 bg-white py-3 text-xs font-black text-[#5f5369]"
            href="/services/mine"
          >
            Моя витрина <ChevronRight className="size-4" />
          </Link>
          <form action={toggleServiceActive}>
            <input name="service_id" type="hidden" value={service.id} />
            <button
              className="w-full rounded-2xl border border-[#2c2036]/10 bg-white py-3 text-xs font-black text-[#5f5369]"
              type="submit"
            >
              {isActive ? "Скрыть объявление" : "Показать снова"}
            </button>
          </form>
          <form action={deleteService}>
            <input name="service_id" type="hidden" value={service.id} />
            <button
              className="w-full rounded-2xl border border-[#f0c8c8] bg-[#fff5f5] py-3 text-xs font-black text-[#c0392b]"
              type="submit"
            >
              Удалить
            </button>
          </form>
        </section>
      ) : (
        <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
          <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
          <p className="text-[10px] leading-4">
            Объявление бесплатное и видно только жителям города. Личные данные и
            переписка не раскрываются.
          </p>
        </section>
      )}
    </main>
  );
}
