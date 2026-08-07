import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  // Arena preview is exposed through a dynamic subdomain under e2b.app.
  // This keeps Next dev HMR/assets usable inside the embedded preview.
  allowedDevOrigins: ["*.e2b.app"],
  // Static assets get long-lived browser cache; the content-addressed build
  // filenames make cache invalidation safe. Synthetic preview art and the
  // manifest are also immutable-ish and cheap to revalidate.
  async headers() {
    return [
      {
        source: "/:path*.(svg|png|jpg|jpeg|webp|ico|woff2|ttf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
