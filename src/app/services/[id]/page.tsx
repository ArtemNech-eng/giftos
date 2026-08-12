import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- signed Storage URLs */
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Eye,
  Flame,
  Hand,
  MapPin,
  MessageSquare,
  Pencil,
  Pin,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { notFound } from "next/navigation";

import {
  addServiceReview,
  bumpService,
  deleteService,
  deleteServiceReview,
  replyToServiceReview,
  toggleServiceActive,
  toggleServiceDemand,
  toggleServicePin,
} from "@/app/services/actions";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { ServiceRating } from "@/components/service-rating";
import { ServiceShareButton } from "@/components/service-share-button";
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
  rating_avg: number | null;
  rating_count: number;
  address: string | null;
  hours: string | null;
};

type HoursDay = { day: number; open?: string; close?: string; closed?: boolean };

function formatHours(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HoursDay[];
    if (!Array.isArray(parsed) || parsed.length !== 7) return null;
    const openDays = parsed.filter((day) => !day.closed && day.open && day.close);
    if (openDays.length === 0) return ["Ежедневно — без графика"];
    const allSame =
      openDays.length === 7 &&
      new Set(openDays.map((day) => `${day.open}-${day.close}`)).size === 1;
    if (allSame) return [`Ежедневно ${openDays[0].open}–${openDays[0].close}`];
    const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const lines: string[] = [];
    let i = 0;
    while (i < 7) {
      const day = parsed[i];
      if (day.closed || !day.open || !day.close) {
        lines.push(`${labels[i]} — выходной`);
        i += 1;
        continue;
      }
      const key = `${day.open}-${day.close}`;
      let j = i;
      while (
        j + 1 < 7 &&
        !parsed[j + 1].closed &&
        `${parsed[j + 1].open}-${parsed[j + 1].close}` === key
      )
        j += 1;
      const range = j === i ? labels[i] : `${labels[i]}–${labels[j]}`;
      lines.push(`${range} ${day.open}–${day.close}`);
      i = j + 1;
    }
    return lines;
  } catch {
    return null;
  }
}

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

  const { data: rawReviews } = await supabase
    .from("service_reviews")
    .select("id, author_id, rating, body, reply, replied_at, created_at, is_hidden")
    .eq("service_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const reviews = (
    (rawReviews ?? []) as Array<{
      id: string;
      author_id: string;
      rating: number;
      body: string | null;
      reply: string | null;
      replied_at: string | null;
      created_at: string;
      is_hidden: boolean;
    }>
  ).filter((review) => (isOwner ? true : !review.is_hidden));
  const myReview = reviews.find((review) => review.author_id === user.id) ?? null;

  const { data: rawCatalog } = await supabase
    .from("service_catalog_items")
    .select("id, title, price")
    .eq("service_id", id)
    .order("sort_order", { ascending: true })
    .limit(8);
  const catalogItems = (rawCatalog ?? []) as Array<{
    id: string;
    title: string;
    price: string;
  }>;
  const hoursLines = formatHours(service.hours);

  const [{ count: demandCount }, { data: myDemand }] = await Promise.all([
    supabase
      .from("service_demands")
      .select("*", { count: "exact", head: true })
      .eq("service_id", id),
    supabase
      .from("service_demands")
      .select("id")
      .eq("service_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const demandWanted = Boolean(myDemand);
  const authorIds = [...new Set(reviews.map((review) => review.author_id))];
  const { data: rawAuthors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .in("id", authorIds)
    : { data: [] };
  const authors = new Map(
    (rawAuthors ?? []).map((author) => [
      author.id,
      {
        name: author.display_name,
        username: author.username,
        avatar: null as string | null,
      },
    ]),
  );
  for (const [authorId, meta] of authors) {
    meta.avatar = await getSignedImageUrl({
      bucket: "avatars",
      path: (rawAuthors ?? []).find((a) => a.id === authorId)?.avatar_path,
    });
  }

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
            {}
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
        <div className="mt-2">
          <ServiceRating
            count={service.rating_count}
            size="size-4"
            value={service.rating_avg}
          />
        </div>
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

        {service.kind === "business" && (service.address || hoursLines) && (
          <div className="mt-4 space-y-2.5">
            {service.address && (
              <p className="flex items-start gap-2 text-[11px] leading-5 text-[#5f5369]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
                <span>
                  <small className="block text-[9px] font-black uppercase tracking-[0.08em] text-[#81748a]">
                    Адрес
                  </small>
                  {service.address}
                </span>
              </p>
            )}
            {hoursLines && (
              <p className="flex items-start gap-2 text-[11px] leading-5 text-[#5f5369]">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
                <span>
                  <small className="block text-[9px] font-black uppercase tracking-[0.08em] text-[#81748a]">
                    Часы работы
                  </small>
                  {hoursLines.map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </span>
              </p>
            )}
          </div>
        )}

        {catalogItems.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#fbf9fe] p-3">
            <small className="block text-[9px] font-black uppercase tracking-[0.08em] text-[#81748a]">
              {service.kind === "business" ? "Меню и цены" : "Услуги и цены"}
            </small>
            <div className="mt-2 divide-y divide-[#efe7f2]">
              {catalogItems.map((item) => (
                <div
                  className="flex items-baseline justify-between gap-3 py-2"
                  key={item.id}
                >
                  <span className="text-[11px] font-semibold leading-4 text-[#5f5369]">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[11px] font-black text-[#7549d0]">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!isOwner && (
          <form action={toggleServiceDemand} className="mt-4">
            <input name="service_id" type="hidden" value={service.id} />
            <button
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-black transition ${
                demandWanted
                  ? "border-[#201827] bg-[#201827] text-white"
                  : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369]"
              }`}
              type="submit"
            >
              <Hand className={`size-4 ${demandWanted ? "fill-current" : ""}`} />
              {demandWanted ? "Хочу такого — отметил(а)" : "Хочу такого мастера"}
              {(demandCount ?? 0) > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    demandWanted
                      ? "bg-white/15 text-white"
                      : "bg-[#f0e9ff] text-[#7549d0]"
                  }`}
                >
                  {(demandCount ?? 0) + (demandWanted ? 0 : 0)}
                </span>
              )}
            </button>
            <p className="mt-2 text-center text-[9px] leading-4 text-[#a093a6]">
              {demandWanted
                ? "Ты показал(а) спрос — мастер видит, что его ждут."
                : `Спрос видят в городе: ${demandCount ?? 0} ${
                    (demandCount ?? 0) === 1 ? "человек хочет" : "человек хотят"
                  } такую услугу.`}
            </p>
          </form>
        )}
      </article>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#fff6e8] text-[#a87511]">
              <MessageSquare className="size-4" />
            </span>
            <span>
              <h2 className="text-sm font-black">Отзывы</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                {service.rating_count > 0
                  ? `${service.rating_count} · репутация мастера в городе`
                  : "Пока нет — будь первым"}
              </p>
            </span>
          </span>
          {service.rating_count > 0 && (
            <ServiceRating count={service.rating_count} value={service.rating_avg} />
          )}
        </div>

        {reviews.length > 0 && (
          <div className="mt-4 space-y-3">
            {reviews.map((review) => {
              const author = authors.get(review.author_id);
              const canReply = isOwner && !review.reply;
              return (
                <article className="rounded-2xl bg-[#fbf9fe] p-3" key={review.id}>
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] text-[10px] font-black text-white">
                      {author?.avatar ? (
                        <img
                          alt=""
                          className="size-full object-cover"
                          decoding="async"
                          src={author.avatar}
                        />
                      ) : (
                        (author?.name ?? "?").slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0 grow">
                      <span className="flex items-center justify-between gap-2">
                        <b className="truncate text-[11px]">
                          {author?.name ?? "Житель города"}
                        </b>
                        <span className="flex shrink-0 items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              className={`size-3 ${
                                star <= review.rating
                                  ? "fill-[#ffb020] text-[#ffb020]"
                                  : "fill-[#e8e0d6] text-[#e8e0d6]"
                              }`}
                              key={star}
                            />
                          ))}
                        </span>
                      </span>
                      {review.body && (
                        <p className="mt-1.5 whitespace-pre-line text-[11px] leading-5 text-[#5f5369]">
                          {review.body}
                        </p>
                      )}
                      {review.reply && (
                        <div className="mt-2.5 rounded-xl border-l-2 border-[#8753e6] bg-white px-3 py-2">
                          <small className="block text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
                            Ответ владельца
                          </small>
                          <p className="mt-1 text-[10px] leading-4 text-[#5f5369]">
                            {review.reply}
                          </p>
                        </div>
                      )}
                      {canReply && (
                        <form action={replyToServiceReview} className="mt-2.5">
                          <input name="review_id" type="hidden" value={review.id} />
                          <input
                            className="w-full rounded-xl border border-[#2c2036]/10 bg-white px-3 py-2 text-[10px] outline-none placeholder:text-[#aaa0ae]"
                            maxLength={1000}
                            name="reply"
                            placeholder="Ответить на отзыв…"
                          />
                          <button
                            className="mt-1.5 rounded-lg bg-[#f0e9ff] px-3 py-1.5 text-[10px] font-black text-[#7549d0]"
                            type="submit"
                          >
                            Ответить
                          </button>
                        </form>
                      )}
                    </span>
                  </div>
                  {review.author_id === user.id && (
                    <form action={deleteServiceReview} className="mt-2 text-right">
                      <input name="review_id" type="hidden" value={review.id} />
                      <button
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-[#c0392b]"
                        type="submit"
                      >
                        <Trash2 className="size-3" /> Удалить отзыв
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!isOwner && !myReview && (
          <form
            action={addServiceReview}
            className="mt-4 rounded-2xl border border-dashed border-[#cdbbe7] bg-[#fffcff] p-3"
          >
            <b className="block text-[11px]">Оценить мастера</b>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star}>
                  <input
                    className="peer sr-only"
                    name="rating"
                    required
                    type="radio"
                    value={star}
                  />
                  <Star className="size-6 cursor-pointer fill-[#e8e0d6] text-[#e8e0d6] peer-checked:fill-[#ffb020] peer-checked:text-[#ffb020]" />
                </label>
              ))}
            </div>
            <input name="service_id" type="hidden" value={service.id} />
            <textarea
              className="mt-2 min-h-16 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-2.5 text-[10px] leading-4 outline-none placeholder:text-[#aaa0ae]"
              maxLength={1000}
              name="body"
              placeholder="Расскажи, как прошло — поможешь городу выбрать"
            />
            <button
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-2.5 text-[10px] font-black text-white shadow-[0_6px_14px_rgba(160,75,213,.2)]"
              type="submit"
            >
              Оставить отзыв
            </button>
          </form>
        )}
      </section>

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
          <ServiceShareButton
            cityName={null}
            ownerName={service.owner_display_name}
            serviceId={service.id}
            title={service.title}
          />
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
        <section className="mt-4">
          <ServiceShareButton
            cityName={null}
            ownerName={service.owner_display_name}
            serviceId={service.id}
            title={service.title}
          />
          <p className="mt-2 text-center text-[9px] leading-4 text-[#a093a6]">
            Поделись карточкой — в чатах города откроется красивая визитка мастера.
          </p>
        </section>
      )}
    </main>
  );
}
