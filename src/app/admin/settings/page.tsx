import { CheckCircle2, Coins, Gift, ShieldCheck } from "lucide-react";

import { updateSettings } from "@/app/admin/settings/actions";
import { AdminNav } from "@/components/admin-nav";
import { requireModerator } from "@/lib/auth";

export const metadata = {
  title: "Настройки платформы",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase, role } = await requireModerator();
  const { saved } = await searchParams;
  const { data: settings } = await supabase
    .from("bonus_settings")
    .select(
      "referral_reward, hold_days, daily_spend_limit, referral_daily_cap, profile_promotion_cost, live_promotion_cost, event_promotion_cost",
    )
    .eq("id", true)
    .maybeSingle();

  const fields = [
    {
      section: "Реферальная программа",
      icon: Gift,
      tint: "bg-[#fff1cd] text-[#ae7914]",
      items: [
        {
          name: "referral_reward",
          label: "Награда за активного приглашённого, ⭐",
          value: settings?.referral_reward ?? 200,
        },
        {
          name: "hold_days",
          label: "Проверка перед зачислением, дней",
          value: settings?.hold_days ?? 0,
        },
        {
          name: "referral_daily_cap",
          label: "Макс. наград за день, ⭐",
          value: settings?.referral_daily_cap ?? 1000,
        },
      ],
    },
    {
      section: "Лимиты трат",
      icon: Coins,
      tint: "bg-amber-50 text-[#b8860b]",
      items: [
        {
          name: "daily_spend_limit",
          label: "Дневной лимит трат на пользователя, ⭐",
          value: settings?.daily_spend_limit ?? 2000,
        },
      ],
    },
    {
      section: "Продвижение (100% в доход платформы)",
      icon: ShieldCheck,
      tint: "bg-violet-50 text-[#8b5cf6]",
      items: [
        {
          name: "profile_promotion_cost",
          label: "Профиль, ⭐ / 24ч",
          value: settings?.profile_promotion_cost ?? 300,
        },
        {
          name: "live_promotion_cost",
          label: "Эфир, ⭐ / 6ч",
          value: settings?.live_promotion_cost ?? 150,
        },
        {
          name: "event_promotion_cost",
          label: "Событие, ⭐ / 24ч",
          value: settings?.event_promotion_cost ?? 100,
        },
      ],
    },
  ];

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Настройки платформы
          </h1>
        </div>
        <ShieldCheck className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <AdminNav active="/admin/settings" />

      {saved === "1" && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="size-4" /> Настройки сохранены.
        </p>
      )}

      {role !== "admin" ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[#e7d8dc] p-5 text-sm text-[#9b858c]">
          Изменение настроек доступно только администратору.
        </p>
      ) : (
        <form action={updateSettings} className="mt-6 space-y-6">
          {fields.map((field) => (
            <section className="surface rounded-2xl p-5" key={field.section}>
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl ${field.tint}`}
                >
                  <field.icon className="size-5" />
                </span>
                <h2 className="font-bold">{field.section}</h2>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {field.items.map((item) => (
                  <label className="block" key={item.name}>
                    <span className="text-xs font-semibold text-[#8e747c]">
                      {item.label}
                    </span>
                    <input
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#ead9df] bg-white px-3 text-sm font-semibold outline-none focus:border-[#df4f7d]"
                      defaultValue={item.value}
                      min="1"
                      name={item.name}
                      type="number"
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}
          <div className="flex items-center gap-3">
            <button
              className="h-11 rounded-xl bg-[#df4f7d] px-6 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
              type="submit"
            >
              Сохранить настройки
            </button>
            <p className="text-xs text-[#9b858c]">
              Изменения применяются сразу для всех пользователей.
            </p>
          </div>
        </form>
      )}
    </>
  );
}
