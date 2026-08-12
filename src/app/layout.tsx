import type { Metadata, Viewport } from "next";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7549d0",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru"),
  title: {
    default: "Хочу также — живое медиапространство города",
    template: "%s · Хочу также",
  },
  description:
    "Живое медиапространство города: люди, места, эфиры, stories, поддержка и авторские страницы.",
  applicationName: "Хочу также",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Хочу также",
    locale: "ru_RU",
    type: "website",
    title: "Хочу также — живое медиапространство города",
    description:
      "Люди, места, эфиры, stories, поддержка и авторские страницы в одном городском ритме.",
    images: [
      {
        url: "/og?type=home&title=Хочу%20также&subtitle=Смотри,%20что%20сейчас%20происходит%20в%20твоём%20городе.%20Создавай%20свой%20сюжет.",
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
