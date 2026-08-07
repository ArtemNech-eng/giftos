import Link from "next/link";
import { CirclePlus, Heart, House, Search, UserRound } from "lucide-react";

export function CreatorBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-white/10 bg-[#11131c]/95 px-3 py-2 text-[#b9b2c7] backdrop-blur md:hidden"
      aria-label="Нижняя навигация"
    >
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/feed"
      >
        <House className="size-5" />
        Главная
      </Link>
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/search"
      >
        <Search className="size-5" />
        Поиск
      </Link>
      <Link
        aria-label="Хочу также"
        className="-mt-5 grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#ff4c87] to-[#7e42ff] text-white shadow-[0_6px_24px_rgba(175,71,255,0.45)]"
        href="/creator/start"
      >
        <CirclePlus className="size-6" />
      </Link>
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/notifications"
      >
        <Heart className="size-5" />
        Активность
      </Link>
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/auth/sign-in"
      >
        <UserRound className="size-5" />
        Профиль
      </Link>
    </nav>
  );
}
