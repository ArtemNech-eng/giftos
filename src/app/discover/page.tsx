import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Открывать желания" };

export default function DiscoverPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <section className="surface rounded-2xl p-7 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fff0cf] text-[#c7812e]">
            <Compass className="size-7" />
          </span>
          <p className="mt-5 text-sm font-semibold text-[#bd3e66]">
            Discovery в разработке
          </p>
          <h1 className="mt-2 text-2xl font-bold">Желания по интересам</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#826c73]">
            Категории уже зафиксированы в схеме. Следующим продуктовым срезом станет
            поиск публичных желаний и сборов.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#b13f61]"
            href="/"
          >
            <ArrowLeft className="size-4" /> К ленте
          </Link>
        </section>
      </main>
    </>
  );
}
