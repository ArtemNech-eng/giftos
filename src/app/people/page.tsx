import Link from "next/link";
import type { Route } from "next";
import { MapPin, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Люди" };
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  if (!hasSupabaseEnvironment()) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <EmptyState
            actionHref="/"
            actionLabel="К ленте"
            description="Подключите Supabase, чтобы здесь появились реальные публичные профили и интересы участников."
            title="Каталог людей готовится"
          />
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const { data: people } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, city, show_city, created_at")
    .eq("profile_visibility", "public")
    .eq("is_suspended", false)
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#bd3e66]">Сообщество GiftOS</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Люди и их желания
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
              Находите тех, с кем совпадают интересы, мечты и поводы поддержать друг
              друга.
            </p>
          </div>
          <UsersRound className="mb-2 hidden size-8 text-[#d34872] sm:block" />
        </div>
        <section className="mt-8">
          {(people?.length ?? 0) > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people!.map((person, index) => (
                <Link
                  className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                  href={`/u/${person.username}` as Route}
                  key={person.id}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-12 place-items-center rounded-2xl text-lg font-bold text-white ${["bg-[#e2a9a2]", "bg-[#9fc6b6]", "bg-[#b7a1d2]"][index % 3]}`}
                    >
                      {person.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{person.display_name}</p>
                      <p className="truncate text-sm text-[#8e747c]">
                        @{person.username}
                      </p>
                    </div>
                  </div>
                  {person.bio && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#715b62]">
                      {person.bio}
                    </p>
                  )}
                  {person.show_city && person.city && (
                    <p className="mt-4 inline-flex items-center gap-1 text-xs text-[#8e747c]">
                      <MapPin className="size-3.5" /> {person.city}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/onboarding"
              actionLabel="Создать свой профиль"
              description="Публичные профили появятся после того, как первые участники завершат регистрацию."
              title="Пока здесь тихо"
            />
          )}
        </section>
      </main>
    </>
  );
}
