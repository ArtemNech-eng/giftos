import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { requireModerator } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireModerator();

  return (
    <div className="min-h-screen bg-[#fbf7f9]">
      <header className="border-b border-[#f0e2e6] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link className="flex items-center gap-2.5" href="/admin">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight">
                Панель управления
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a13d5e]">
                {role === "admin" ? "Администратор" : "Модератор"}
              </span>
            </span>
          </Link>
          <Link
            className="rounded-xl border border-[#ead9df] bg-white px-3 py-2 text-xs font-semibold text-[#765f66] transition hover:bg-[#fff5f7]"
            href="/feed"
          >
            ← В приложение
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</div>
    </div>
  );
}
