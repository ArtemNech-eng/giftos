import Link from "next/link";
import { Bell, Gift, Search } from "lucide-react";

import { AuthHeaderActions } from "@/components/auth-header-actions";
import { LiveNotificationRefresh } from "@/components/live-notification-refresh";
import { APP_NAME } from "@/lib/constants";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/", label: "Лента" },
  { href: "/people", label: "Люди" },
  { href: "/discover", label: "Желания" },
] as const;

export async function SiteHeader() {
  let username: string | null = null;
  let userId: string | null = null;
  let unreadNotifications = 0;

  if (hasSupabaseEnvironment()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const [{ data: profile }, { count }] = await Promise.all([
          supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
          supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("recipient_id", user.id)
            .is("read_at", null),
        ]);
        username = profile?.username ?? null;
        unreadNotifications = count ?? 0;
      }
    } catch {
      // Public pages remain available while Supabase is not connected.
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-[#fcf8f7]/80 backdrop-blur-xl">
      {userId && <LiveNotificationRefresh recipientId={userId} />}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#df4f7d] text-white shadow-sm">
            <Gift className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg">{APP_NAME}</span>
        </Link>
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Основная навигация"
        >
          {navItems.map((item) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#705c63] transition hover:bg-white hover:text-[#bd3e66]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            aria-label="Поиск"
            className="grid size-9 place-items-center rounded-lg text-[#705c63] transition hover:bg-white hover:text-[#bd3e66]"
            href="/search"
          >
            <Search className="size-4" />
          </Link>
          {username ? (
            <Link
              aria-label="Уведомления"
              className="relative hidden size-9 place-items-center rounded-lg text-[#705c63] transition hover:bg-white hover:text-[#bd3e66] sm:grid"
              href="/notifications"
            >
              <Bell className="size-4" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-[#df4f7d] px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          ) : (
            <button
              aria-label="Уведомления"
              className="hidden size-9 place-items-center rounded-lg text-[#705c63] transition hover:bg-white hover:text-[#bd3e66] sm:grid"
              type="button"
            >
              <Bell className="size-4" />
            </button>
          )}
          <AuthHeaderActions username={username} />
        </div>
      </div>
    </header>
  );
}
