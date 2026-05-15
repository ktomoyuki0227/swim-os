/**
 * レッスンタイトルから対応する画像パスを返す
 */
export function getLessonImage(title: string): string {
  const t = title.toLowerCase()
  if (t.includes("子ども") || t.includes("キッズ") || t.includes("kids")) {
    return "/images/lessons/children.jpg"
  }
  if (t.includes("バタフライ") || t.includes("背泳ぎ") || t.includes("butterfly") || t.includes("backstroke")) {
    return "/images/lessons/butterfly.jpg"
  }
  if (t.includes("平泳ぎ") || t.includes("breaststroke")) {
    return "/images/lessons/breaststroke.jpg"
  }
  return "/images/lessons/crawl.jpg"
}

/**
 * 予約・レッスンのステータスラベル
 */
export const bookingStatusLabels: Record<string, string> = {
  pending: "確認待ち",
  confirmed: "確定",
  cancelled: "キャンセル済み",
}

export const bookingStatusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
}

/**
 * レッスンのステータスラベル
 */
export const lessonStatusLabels: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  cancelled: "キャンセル",
}

export const lessonStatusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  published: "default",
  cancelled: "destructive",
}
