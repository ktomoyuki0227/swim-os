import type { MetadataRoute } from "next"

// layout.tsx / robots.ts と同じ環境変数・フォールバックに揃える
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rangers.example.com"

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/login", changeFrequency: "monthly", priority: 0.5 },
  { path: "/register", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/price", changeFrequency: "monthly", priority: 0.6 },
  { path: "/coach-recruit", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/tokushoho", changeFrequency: "yearly", priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
