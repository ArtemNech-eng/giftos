/** Gift reasons (occasions) — like Telegram gift occasions. */

export const GIFT_REASONS = [
  { code: "birthday", label: "С днём рождения", emoji: "🎂" },
  { code: "just_because", label: "Просто так", emoji: "💛" },
  { code: "love", label: "Люблю", emoji: "❤️" },
  { code: "sorry", label: "Извини", emoji: "🙏" },
  { code: "victory", label: "Победа", emoji: "🏆" },
  { code: "congrats", label: "Поздравляю", emoji: "🎉" },
] as const;

export type GiftReasonCode = (typeof GIFT_REASONS)[number]["code"];

export const reasonLabel = (code: string | null | undefined) =>
  GIFT_REASONS.find((reason) => reason.code === code) ?? null;
