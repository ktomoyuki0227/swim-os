/**
 * レッスンタイトルから対応する画像パスを返す
 */
export function getLessonImage(title: string): string {
  if (title.includes("子ども") || title.includes("キッズ")) {
    return "/images/lessons/children.jpg"
  }
  if (title.includes("バタフライ") || title.includes("背泳ぎ")) {
    return "/images/lessons/butterfly.jpg"
  }
  if (title.includes("平泳ぎ")) {
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
