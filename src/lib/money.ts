export function parseAmountToMinor(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) return null;

  return Math.round(amount * 100);
}

export function formatRubles(amountMinor: number | bigint | null | undefined) {
  const amount = Number(amountMinor ?? 0) / 100;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
