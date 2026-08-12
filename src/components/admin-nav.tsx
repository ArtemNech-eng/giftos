import Link from "next/link";
import {
  Activity,
  ClipboardList,
  Coins,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

const LINKS = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Жалобы", icon: ShieldAlert },
  { href: "/admin/stories", label: "Видео", icon: Activity },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/economy", label: "Экономика", icon: Coins },
  { href: "/admin/city", label: "Город", icon: MapPin },
  { href: "/admin/actions", label: "Действия", icon: ClipboardList },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
] as const;

export async function AdminNav({ active }: { active: string }) {
  // Live open-report badge: the queue is the most time-sensitive section,
  // so the count sits right in the navigation, not only on the page.
  let openReports = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_review"]);
    openReports = count ?? 0;
  } catch {
    // Navigation must render even if the count query fails.
  }

  return (
    <nav className="sticky top-0 z-20 -mx-4 mt-6 flex gap-1 overflow-x-auto bg-[#f5e9ed] px-4 py-1 sm:mx-0 sm:rounded-xl sm:px-1">
      {LINKS.map((link) => {
        const isActive = link.href === active;
        const badge = link.href === "/admin/reports" ? openReports : 0;
        return (
          <Link
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              isActive
                ? "bg-white text-[#bd3e66] shadow-sm"
                : "text-[#8e6a75] hover:text-[#bd3e66]"
            }`}
            href={link.href}
            key={link.href}
          >
            <link.icon className="size-4" /> {link.label}
            {badge > 0 && (
              <span className="grid min-w-4 place-items-center rounded-full bg-[#e5396b] px-1 py-0.5 text-[9px] font-black leading-none text-white">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
