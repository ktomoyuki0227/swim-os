import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/lessons`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  // 公開中の今後のレッスンを動的に追加
  try {
    const supabase = await createClient()
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, updated_at")
      .eq("status", "published")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })

    const lessonRoutes: MetadataRoute.Sitemap = (lessons ?? []).map((lesson) => ({
      url: `${BASE_URL}/lessons/${lesson.id}`,
      lastModified: new Date(lesson.updated_at ?? new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...lessonRoutes]
  } catch {
    return staticRoutes
  }
}
