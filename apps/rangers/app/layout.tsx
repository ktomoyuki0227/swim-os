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

export const metadata: Metadata = {
  title: {
    default: "Rangers - マスターズ水泳レッスン予約",
    template: "%s | Rangers",
  },
  description: "マスターズ水泳・個人指導のレッスン予約プラットフォーム。指導員と直接つながり、あなたのペースで上達しよう。",
  openGraph: {
    title: "Rangers - マスターズ水泳レッスン予約",
    description: "マスターズ水泳・個人指導のレッスン予約プラットフォーム",
    type: "website",
    locale: "ja_JP",
    siteName: "Rangers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rangers - マスターズ水泳レッスン予約",
    description: "マスターズ水泳・個人指導のレッスン予約プラットフォーム",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
