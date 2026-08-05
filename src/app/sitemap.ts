import type { MetadataRoute } from "next";

import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru";
  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
  if (!hasSupabaseEnvironment()) return entries;

  try {
    const supabase = await createClient();
    const [{ data: creators }, { data: wishes }, { data: fundraisers }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("username, updated_at")
          .eq("profile_visibility", "public")
          .eq("is_suspended", false)
          .limit(5000),
        supabase
          .from("wishes")
          .select("id, updated_at")
          .eq("visibility", "public")
          .eq("is_archived", false)
          .limit(5000),
        supabase
          .from("fundraisers")
          .select("slug, updated_at")
          .eq("visibility", "public")
          .in("status", ["active", "goal_reached", "closed"])
          .limit(5000),
      ]);
    entries.push(
      ...(creators ?? []).map((item) => ({
        url: `${baseUrl}/u/${item.username}`,
        lastModified: new Date(item.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );
    entries.push(
      ...(wishes ?? []).map((item) => ({
        url: `${baseUrl}/wishes/${item.id}`,
        lastModified: new Date(item.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    );
    entries.push(
      ...(fundraisers ?? []).map((item) => ({
        url: `${baseUrl}/fundraisers/${item.slug}`,
        lastModified: new Date(item.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    );
  } catch {
    // Landing page remains indexable even before the data service is configured.
  }
  return entries;
}
