/** 通知文で使う「7月28日(火)」形式の日付表示。JSTで解釈する。 */
export function formatSessionDateJa(date: string | Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  })
}
