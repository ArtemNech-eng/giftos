import { headers } from "next/headers";

/**
 * Best-effort client IP for referral anti-fraud. Read from the standard
 * proxy headers; returns null when unavailable (local dev, direct access).
 * Only the first address of x-forwarded-for is trusted (the client), and
 * only if it parses as an IPv4/IPv6 address — anything else is dropped.
 */
export async function clientIp(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first && isIpLike(first)) return first;
    }
    const real = headerStore.get("x-real-ip");
    if (real && isIpLike(real)) return real;
  } catch {
    // headers() is unavailable outside request scope.
  }
  return null;
}

function isIpLike(value: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return value.split(".").every((part) => Number(part) <= 255);
  }
  return /^[0-9a-fA-F:]{2,45}$/.test(value) && value.includes(":");
}
