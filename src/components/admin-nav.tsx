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

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="sticky top-0 z-20 -mx-4 mt-6 flex gap-1 overflow-x-auto bg-[#f5e9ed] px-4 py-1 sm:mx-0 sm:rounded-xl sm:px-1">
      {LINKS.map((link) => {
        const isActive = link.href === active;
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
          </Link>
        );
      })}
    </nav>
  );
}
