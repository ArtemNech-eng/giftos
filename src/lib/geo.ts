import "server-only";

/**
 * Detect the user's city by IP via Dadata (Russian geo service).
 *
 * Dadata is a Russian company (data stays in the RF) and offers a free
 * starter tier (10k requests/day): https://dadata.ru/api/detect-address-by-ip/
 * Set DADATA_API_KEY in the environment. Without the key the function
 * gracefully returns null and onboarding simply does not prefill the city.
 */
export async function detectCityByIp(
  ip: string,
): Promise<{ city: string; region: string | null } | null> {
  const token = process.env.DADATA_API_KEY;
  if (!token || !ip) return null;
  // Local/private addresses cannot be geolocated.
  if (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip === "unknown"
  ) {
    return null;
  }

  try {
    const response = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/detectAddressByIp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ ip }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      location?: { data?: { city?: string; region?: string } };
    };
    const locationData = data?.location?.data;
    const city = locationData?.city;
    if (!city) return null;
    return {
      city,
      region: locationData.region ?? null,
    };
  } catch {
    // Geo detection is best-effort; it must never break onboarding.
    return null;
  }
}
