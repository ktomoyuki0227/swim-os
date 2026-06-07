import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rangers.example.com"
const OG_IMAGE = `${APP_URL}/og-image.png`

export const metadata: Metadata = {
  title: {
    default: "Rangers - マスターズ水泳レッスン予約",
    template: "%s | Rangers",
  },
  description: "マスターズ水泳・個人指導のレッスン予約プラットフォーム。指導員と直接つながり、あなたのペースで上達しよう。",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Rangers - マスターズ水泳レッスン予約",
    description: "マスターズ水泳・個人指導のレッスン予約プラットフォーム",
    type: "website",
    locale: "ja_JP",
    siteName: "Rangers",
    url: APP_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Rangers - マスターズ水泳レッスン予約",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rangers - マスターズ水泳レッスン予約",
    description: "マスターズ水泳・個人指導のレッスン予約プラットフォーム",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
