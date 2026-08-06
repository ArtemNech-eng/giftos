import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

import { deleteProfileMedia, uploadProfileMedia } from "@/app/profile/media/actions";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

export const metadata = {
  title: "Мои фото",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ProfileMediaPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/feed");

  const { data: rawMedia } = await supabase
    .from("profile_media")
    .select("id, storage_path, visibility, sort_order")
    .eq("profile_id", user.id)
    .order("sort_order", { ascending: true });
  const media = await Promise.all(
    (rawMedia ?? []).map(async (item) => ({
      ...item,
      url: await getSignedImageUrl({
        bucket: "profile-media",
        path: item.storage_path,
      }),
    })),
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href={`/u/${profile.username}`}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Мои фото</h1>
        <span className="w-9" />
      </header>

      <p className="mt-4 text-sm leading-6 text-[#b9b1c5]">
        До шести фотографий. Первая — обложка профиля.
      </p>

      <form action={uploadProfileMedia} className="mt-5" encType="multipart/form-data">
        <input name="username" type="hidden" value={profile.username} />
        <input
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-[#c5bdce] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f24d98] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          multiple
          name="photos"
          type="file"
        />
        <div className="mt-3 flex gap-2">
          <select
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            defaultValue="public"
            name="visibility"
          >
            <option value="public">Публичные</option>
            <option value="private">Приватные</option>
          </select>
          <button
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
            type="submit"
          >
            <ImagePlus className="size-4" /> Добавить
          </button>
        </div>
      </form>

      <section className="mt-6">
        {media.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa2b4]">
            Фотографий пока нет — добавьте первую.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {media.map((item, index) => (
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171923]"
                key={item.id}
              >
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL has no stable host
                  <img
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                    src={item.url}
                  />
                ) : (
                  <div className="grid aspect-[4/3] w-full place-items-center bg-white/5 text-[#aaa4b7]">
                    Фото
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold">
                  {index === 0 ? "Обложка" : `#${index + 1}`}
                </span>
                {item.visibility === "private" && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px]">
                    🔒
                  </span>
                )}
                <form action={deleteProfileMedia} className="absolute bottom-2 right-2">
                  <input name="media_id" type="hidden" value={item.id} />
                  <input name="username" type="hidden" value={profile.username} />
                  <button
                    aria-label="Удалить фото"
                    className="grid size-8 place-items-center rounded-full bg-black/60 text-[#ff9bc5]"
                    type="submit"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href={`/u/${profile.username}` as Route}
      >
        <ArrowLeft className="size-4" /> К профилю
      </Link>
    </main>
  );
}
