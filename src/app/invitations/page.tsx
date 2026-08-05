import Link from "next/link";
import { CalendarDays, MailOpen, UserRoundPlus } from "lucide-react";

import {
  acceptPrivateFundraiserInvite,
  declinePrivateFundraiserInvite,
} from "@/app/invitations/actions";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Приглашения" };
export const dynamic = "force-dynamic";

type Invitation = {
  fundraiser_id: string;
  slug: string;
  title: string;
  description: string | null;
  ends_at: string | null;
  inviter_username: string | null;
  inviter_display_name: string | null;
  invited_at: string;
};

export default async function InvitationsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("my_pending_private_fundraiser_invites");
  if (error) throw new Error(`Не удалось загрузить приглашения: ${error.message}`);

  const invitations = (data ?? []) as Invitation[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#bd3e66]">Личный доступ</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Приглашения</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
              Приватные сборы доступны только после вашего согласия.
            </p>
          </div>
          <MailOpen className="mb-2 hidden size-8 text-[#d34872] sm:block" />
        </div>

        <section className="mt-8">
          {invitations.length === 0 ? (
            <EmptyState
              actionHref="/"
              actionLabel="Посмотреть ленту"
              description="Новых приглашений в приватные сборы пока нет. Когда кто-то добавит вас, оно появится здесь."
              title="Всё просмотрено"
            />
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const endsAt = invitation.ends_at
                  ? new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(invitation.ends_at))
                  : null;

                return (
                  <article
                    className="surface rounded-2xl p-5 sm:p-6"
                    key={invitation.fundraiser_id}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fce5ec] px-2.5 py-1 text-xs font-semibold text-[#bd3e66]">
                          <UserRoundPlus className="size-3.5" /> Приватный сбор
                        </span>
                        <h2 className="mt-3 text-xl font-bold">{invitation.title}</h2>
                        {invitation.inviter_display_name && (
                          <p className="mt-2 text-sm text-[#816970]">
                            Приглашает{" "}
                            {invitation.inviter_username ? (
                              <Link
                                className="font-semibold text-[#a13d5e]"
                                href={`/u/${invitation.inviter_username}`}
                              >
                                {invitation.inviter_display_name}
                              </Link>
                            ) : (
                              invitation.inviter_display_name
                            )}
                          </p>
                        )}
                        {invitation.description && (
                          <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-[#725c63]">
                            {invitation.description}
                          </p>
                        )}
                        {endsAt && (
                          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#8e747c]">
                            <CalendarDays className="size-4" /> До {endsAt}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <form action={acceptPrivateFundraiserInvite}>
                          <input
                            name="fundraiser_id"
                            type="hidden"
                            value={invitation.fundraiser_id}
                          />
                          <button
                            className="inline-flex h-10 items-center rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
                            type="submit"
                          >
                            Принять
                          </button>
                        </form>
                        <form action={declinePrivateFundraiserInvite}>
                          <input
                            name="fundraiser_id"
                            type="hidden"
                            value={invitation.fundraiser_id}
                          />
                          <button
                            className="inline-flex h-10 items-center rounded-xl border border-[#ead9df] bg-white px-4 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
                            type="submit"
                          >
                            Отклонить
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
