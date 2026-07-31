/** 通知文で使う「7月28日(火)」形式の日付表示。JSTで解釈する。 */
export function formatSessionDateJa(date: string | Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  })
}

// datetime-local由来("YYYY-MM-DDTHH:mm")はそのまま、type="date"由来の日付のみの文字列
// ("YYYY-MM-DD")には時刻がないため、末尾に"+09:00"だけを連結すると
// "2026-08-05+09:00"のような不正な日時文字列になりtoISOString()がRangeErrorを投げる。
export function toJstIso(value: string): string {
  const withTime = value.includes("T") ? value : `${value}T00:00:00`
  return new Date(`${withTime}+09:00`).toISOString()
}

// 申込み締切(registration_deadline)は日付のみ(type="date")で入力される。
// 「◯月◯日まで受付」という直感に合わせ、その日の終わり(23:59:59 JST)を締切時刻とする
// (toJstIso()をそのまま使うとその日の開始=00:00 JSTになり、実質前日で締め切られてしまう)。
export function toJstEndOfDayIso(value: string): string {
  const dateOnly = value.includes("T") ? value.split("T")[0] : value
  return new Date(`${dateOnly}T23:59:59+09:00`).toISOString()
}
