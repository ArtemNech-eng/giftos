import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "lucide-react";

export const metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="landing-light relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f7f3fa] px-5 py-16 text-center text-[#201827]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[-10rem] size-[26rem] rounded-full bg-[#ffc3dc]/70 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-[-12rem] size-[26rem] rounded-full bg-[#dfd2ff]/80 blur-[110px]"
      />

      <span className="relative inline-flex items-center gap-2 rounded-full border border-[#261b31]/10 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#8753e6] backdrop-blur">
        <MapPin className="size-3.5" /> Такой страницы нет в городе
      </span>
      <h1 className="relative mt-7 text-[clamp(4.5rem,16vw,9rem)] font-black leading-[0.8] tracking-[-0.1em]">
        404
      </h1>
      <p className="relative mt-5 max-w-md text-lg font-black leading-6 tracking-[-0.02em] sm:text-xl">
        Похоже, ссылка устарела —
        <br />
        или ты просто зашёл не туда.
      </p>
      <p className="relative mt-3 max-w-sm text-sm leading-6 text-[#6a5e73]">
        Желания, места и люди никуда не делись. Вернись на главную и продолжай свой
        маршрут по городу.
      </p>
      <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-[#201827] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#4b2d66]"
          href="/"
        >
          На главную
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          className="inline-flex h-12 items-center gap-2 rounded-full border border-[#261b31]/10 bg-white/70 px-6 text-sm font-black text-[#8753e6] backdrop-blur transition hover:border-[#8753e6]/40"
          href="/preview?screen=feed"
        >
          <Heart className="size-4 fill-current" />
          Смотреть продукт
        </Link>
      </div>
    </main>
  );
}
