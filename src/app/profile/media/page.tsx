import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ImagePlus, Images, Lock, Trash2 } from "lucide-react";
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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к профилю"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={`/u/${profile.username}`}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Ваш профиль
          </small>
          <h1 className="mt-0.5 text-sm font-black">Мои фото</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Images className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_32px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#d84b81]">
          <Images className="size-3.5" /> Галерея
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          До шести
          <br />
          фотографий.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-[#756a7d]">
          Первая — обложка профиля. Остальные показывают вашу историю людям, которые
          заходят в гости.
        </p>
      </section>

      <form
        action={uploadProfileMedia}
        className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
        encType="multipart/form-data"
      >
        <input name="username" type="hidden" value={profile.username} />
        <span className="text-xs font-black">Добавить фото</span>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="mt-3 block w-full rounded-xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] p-3 text-[10px] text-[#756a7d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f0e9ff] file:px-3 file:py-2 file:text-[10px] file:font-black file:text-[#7549d0]"
          multiple
          name="photos"
          type="file"
        />
        <div className="mt-3 flex gap-2">
          <select
            className="h-10 grow rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-xs font-semibold text-[#5f5369] outline-none focus:border-[#b28be8]"
            defaultValue="public"
            name="visibility"
          >
            <option value="public">Публичные</option>
            <option value="private">Приватные</option>
          </select>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(160,75,213,.24)]"
            type="submit"
          >
            <ImagePlus className="size-4" /> Добавить
          </button>
        </div>
      </form>

      <section className="mt-6">
        {media.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cdbbe7] bg-white p-6 text-center text-xs leading-5 text-[#756a7d]">
            Фотографий пока нет — добавьте первую.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {media.map((item, index) => (
              <div
                className="border-[#2c2036]/9 relative overflow-hidden rounded-2xl border bg-white shadow-[0_6px_18px_rgba(69,43,94,.07)]"
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
                  <div className="grid aspect-[4/3] w-full place-items-center bg-[#f3ecff] text-[#8753e6]">
                    <Images className="size-6" />
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-[#5f5369]">
                  {index === 0 ? "Обложка" : `#${index + 1}`}
                </span>
                {item.visibility === "private" && (
                  <span
                    className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white/90 text-[#7549d0]"
                    title="Приватное фото"
                  >
                    <Lock className="size-3.5" />
                  </span>
                )}
                <form action={deleteProfileMedia} className="absolute bottom-2 right-2">
                  <input name="media_id" type="hidden" value={item.id} />
                  <input name="username" type="hidden" value={profile.username} />
                  <button
                    aria-label="Удалить фото"
                    className="grid size-8 place-items-center rounded-full bg-white/90 text-[#d84b81]"
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
        className="mt-6 flex items-center justify-center gap-2 text-sm font-black text-[#8753e6]"
        href={`/u/${profile.username}` as Route}
      >
        <ArrowLeft className="size-4" /> К профилю
      </Link>
    </main>
  );
}
