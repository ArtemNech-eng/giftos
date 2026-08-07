import Link from "next/link";
import { Ban, Search, ShieldCheck, UserCheck } from "lucide-react";

import { setSuspension, setUserRole } from "@/app/admin/users/actions";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState } from "@/components/empty-state";
import { requireModerator } from "@/lib/auth";

export const metadata = {
  title: "Пользователи",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  user: "Пользователь",
  moderator: "Модератор",
  admin: "Администратор",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { supabase, role, user } = await requireModerator();
  const { q = "", status = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const statusFilter = status === "suspended" ? "suspended" : "all";

  const baseQuery = supabase
    .from("profiles")
    .select(
      "id, username, display_name, city, is_creator, is_suspended, created_at, user_roles!left(role)",
    );
  if (query) {
    baseQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
  }
  if (statusFilter === "suspended") baseQuery.eq("is_suspended", true);
  const { data: rawProfiles } = await baseQuery
    .order("created_at", { ascending: false })
    .limit(100);

  const profiles = (
    (rawProfiles ?? []) as Array<{
      id: string;
      username: string;
      display_name: string;
      city: string | null;
      is_creator: boolean;
      is_suspended: boolean;
      created_at: string;
      user_roles: Array<{ role: string }> | null;
    }>
  ).map((profile) => ({
    ...profile,
    role: profile.user_roles?.[0]?.role ?? "user",
  }));

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Пользователи</h1>
        </div>
        <ShieldCheck className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <AdminNav active="/admin/users" />

      <form className="mt-8 flex flex-wrap items-center gap-2" method="get">
        <div className="relative min-w-60 grow">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9b858c]" />
          <input
            className="h-10 w-full rounded-xl border border-[#ead9df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#df4f7d]"
            defaultValue={query}
            name="q"
            placeholder="Имя или @username…"
          />
        </div>
        <select
          className="h-10 rounded-xl border border-[#ead9df] bg-white px-3 text-sm"
          defaultValue={statusFilter}
          name="status"
        >
          <option value="all">Все</option>
          <option value="suspended">В бане</option>
        </select>
        <button
          className="h-10 rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white"
          type="submit"
        >
          Найти
        </button>
      </form>

      <section className="mt-6">
        {profiles.length === 0 ? (
          <EmptyState
            actionHref="/admin/users"
            actionLabel="Сбросить фильтры"
            description="Попробуйте изменить запрос или фильтр."
            title="Никого не нашли"
          />
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => {
              const isSelf = profile.id === user.id;
              return (
                <div
                  className="surface flex flex-wrap items-center gap-3 rounded-2xl p-4"
                  key={profile.id}
                >
                  <div className="min-w-0 grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="font-bold text-[#3d2b34] hover:text-[#bd3e66]"
                        href={`/u/${profile.username}`}
                      >
                        {profile.display_name}
                      </Link>
                      <span className="text-xs text-[#9b858c]">
                        @{profile.username}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          profile.role === "admin"
                            ? "bg-[#fce5ec] text-[#bd3e66]"
                            : profile.role === "moderator"
                              ? "bg-violet-50 text-[#8b5cf6]"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ROLE_LABELS[profile.role] ?? profile.role}
                      </span>
                      {profile.is_creator && (
                        <span className="rounded-full bg-gradient-to-r from-[#f94d96] to-[#8953ff] px-2 py-0.5 text-[10px] font-semibold text-white">
                          Автор
                        </span>
                      )}
                      {profile.is_suspended && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          В бане
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#9b858c]">
                      {profile.city ?? "Без города"} · с{" "}
                      {new Intl.DateTimeFormat("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(profile.created_at))}
                    </p>
                  </div>

                  {!isSelf && (
                    <div className="flex flex-wrap items-center gap-2">
                      {role === "admin" && (
                        <form action={setUserRole}>
                          <input name="profile_id" type="hidden" value={profile.id} />
                          <input name="q" type="hidden" value={query} />
                          <select
                            className="h-9 rounded-lg border border-[#ead9df] bg-white px-2 text-xs font-semibold"
                            defaultValue={profile.role}
                            name="role"
                            onChange={(event) => event.target.form?.requestSubmit()}
                          >
                            <option value="user">Пользователь</option>
                            <option value="moderator">Модератор</option>
                            <option value="admin">Администратор</option>
                          </select>
                        </form>
                      )}
                      <form action={setSuspension}>
                        <input name="profile_id" type="hidden" value={profile.id} />
                        <input name="q" type="hidden" value={query} />
                        <input
                          name="suspended"
                          type="hidden"
                          value={String(!profile.is_suspended)}
                        />
                        <button
                          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${
                            profile.is_suspended
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                          disabled={role !== "admin" && !profile.is_suspended}
                          title={
                            role !== "admin" && !profile.is_suspended
                              ? "Восстановление — только для администратора"
                              : undefined
                          }
                          type="submit"
                        >
                          {profile.is_suspended ? (
                            <>
                              <UserCheck className="size-3.5" /> Разбанить
                            </>
                          ) : (
                            <>
                              <Ban className="size-3.5" /> Забанить
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
