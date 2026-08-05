import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/u/", "/wishes/", "/fundraisers/"],
      disallow: [
        "/feed",
        "/stories/",
        "/search",
        "/notifications",
        "/onboarding",
        "/creator/",
        "/admin/",
        "/invitations",
        "/payments/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
