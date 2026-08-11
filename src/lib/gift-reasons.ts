/** Gift reasons (occasions) — like Telegram gift occasions. */

export const GIFT_REASONS = [
  { code: "birthday", label: "С днём рождения" },
  { code: "just_because", label: "Просто так" },
  { code: "love", label: "Люблю" },
  { code: "sorry", label: "Извини" },
  { code: "victory", label: "Победа" },
  { code: "congrats", label: "Поздравляю" },
] as const;

export type GiftReasonCode = (typeof GIFT_REASONS)[number]["code"];

export const reasonLabel = (code: string | null | undefined) =>
  GIFT_REASONS.find((reason) => reason.code === code) ?? null;
