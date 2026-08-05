"use client";

import Link from "next/link";
import type { Route } from "next";
import { Inbox, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AuthHeaderActions({ username }: { username: string | null }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (!username) {
    return (
      <Link
        className="ml-1 inline-flex h-9 items-center rounded-xl bg-[#df4f7d] px-3.5 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
        href="/auth/sign-in"
      >
        Войти
      </Link>
    );
  }

  return (
    <div className="ml-1 flex items-center gap-1">
      <Link
        aria-label="Создать"
        className="grid size-9 place-items-center rounded-xl bg-[#df4f7d] text-white transition hover:bg-[#c93f6d]"
        href="/wishes/new"
      >
        <Plus className="size-4" />
      </Link>
      <Link
        aria-label="Приглашения"
        className="grid size-9 place-items-center rounded-lg text-[#705c63] transition hover:bg-white hover:text-[#bd3e66]"
        href="/invitations"
      >
        <Inbox className="size-4" />
      </Link>
      <Link
        className="hidden rounded-lg px-2 py-2 text-sm font-semibold text-[#705c63] transition hover:bg-white hover:text-[#bd3e66] sm:block"
        href={`/u/${username}` as Route}
      >
        Профиль
      </Link>
      <button
        aria-label="Выйти"
        className="grid size-9 place-items-center rounded-lg text-[#705c63] transition hover:bg-white hover:text-[#bd3e66]"
        onClick={signOut}
        type="button"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
