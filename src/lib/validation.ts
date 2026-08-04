export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function requiredText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function optionalText(value: FormDataEntryValue | null, maxLength: number) {
  const text = requiredText(value, maxLength);
  return text || null;
}

export function isValidUrl(value: string | null) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
