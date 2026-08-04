import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GiftOS — желания, которые объединяют",
    template: "%s · GiftOS",
  },
  description: "Социальная платформа желаний, коллективных сборов, подарков и общения.",
  applicationName: "GiftOS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
