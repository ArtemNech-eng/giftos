import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Хочу также — общайся, выходи в эфир, зарабатывай",
    template: "%s · Хочу также",
  },
  description:
    "Социальная creator-платформа общения, эфиров, поддержки и авторских страниц.",
  applicationName: "Хочу также",
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
