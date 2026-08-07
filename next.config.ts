import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  // Arena preview is exposed through a dynamic subdomain under e2b.app.
  // This keeps Next dev HMR/assets usable inside the embedded preview.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
