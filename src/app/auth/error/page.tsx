import Link from "next/link";

export const metadata = {
  title: "Не удалось войти",
  robots: { index: false, follow: false },
};

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-glow">
        <p className="text-sm font-semibold text-[#bd3e66]">Не удалось войти</p>
        <h1 className="mt-2 text-2xl font-bold">Попробуйте ещё раз</h1>
        <p className="mt-3 text-sm leading-6 text-[#826c73]">
          Ссылка для входа могла устареть или быть уже использована.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-[#df4f7d] px-4 py-2.5 text-sm font-semibold text-white"
          href="/auth/sign-in"
        >
          Вернуться ко входу
        </Link>
      </section>
    </main>
  );
}
