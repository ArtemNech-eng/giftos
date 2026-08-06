import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://hochu-takzhe.ru"),
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
  openGraph: {
    siteName: "Хочу также",
    locale: "ru_RU",
    type: "website",
    title: "Хочу также — общайся, выходи в эфир, зарабатывай",
    description:
      "Социальная creator-платформа общения, эфиров, поддержки и авторских страниц.",
    images: [
      {
        url: "/og?type=home&title=Хочу%20также&subtitle=Общайся.%20Выходи%20в%20эфир.%20Зарабатывай%20на%20своей%20аудитории.",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function () {
                  navigator.serviceWorker.register("/sw.js").catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
