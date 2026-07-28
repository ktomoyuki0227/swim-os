import type { MetadataRoute } from "next"

// sitemap.ts / layout.tsx と同じ環境変数・フォールバックに揃える。
// 旧 public/robots.txt はドメインがハードコードされ、既に廃止された
// /bookings /instructor/ をDisallowしたまま実際の非公開パス(/messages等)が
// 抜けていたため、動的生成に置き換えて一箇所で管理する。
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rangers.example.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/fees",
        "/messages",
        "/notifications",
        "/payments",
        "/profile",
        "/search",
        "/onboarding",
        "/auth",
        "/teams/new",
        "/sessions/new",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
