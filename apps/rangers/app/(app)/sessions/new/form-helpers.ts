import type { FormData, TeamMemberOption } from "./types"

export const STEPS = [
  { label: "基本情報" },
  { label: "参加費" },
  { label: "詳細設定" },
  { label: "配信対象" },
  { label: "確認" },
]

export const DURATION_OPTIONS = [
  { label: "30分", value: "30" },
  { label: "45分", value: "45" },
  { label: "60分", value: "60" },
  { label: "90分", value: "90" },
  { label: "120分", value: "120" },
  { label: "150分", value: "150" },
  { label: "180分", value: "180" },
  { label: "カスタム", value: "custom" },
]

export const DEFAULT_FORM: FormData = {
  title: "",
  type: "practice",
  scheduled_at: "",
  end_at: "",
  duration: "",
  location: "",
  meeting_point: "",
  gender_filter: "all",
  description: "",
  member_price: "1000",
  guest_price: "1500",
  allow_point_card: true,
  registration_deadline: "",
  min_participants: "",
  max_participants: "",
  cancellation_days: "",
  is_external: false,
}

export function calcEndAt(scheduledAt: string, durationMinutes: number): string {
  if (!scheduledAt) return ""
  const d = new Date(scheduledAt)
  d.setMinutes(d.getMinutes() + durationMinutes)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 開始日時・所要時間からend_atを自動計算する（camp種別・custom所要時間は対象外） */
export function recalcEndAt(next: FormData): FormData {
  if (next.type === "camp") return next
  if (next.duration === "custom") return next
  if (!next.duration) return { ...next, end_at: "" }
  const minutes = parseInt(next.duration, 10)
  if (isNaN(minutes)) return next
  return { ...next, end_at: calcEndAt(next.scheduled_at, minutes) }
}

/** タグ選択に応じて対象メンバーIDをAND条件で絞り込む */
export function matchMemberIdsByTags(members: TeamMemberOption[], selectedTags: string[]): string[] {
  if (selectedTags.length === 0) {
    return members.map((m) => m.swimmer.id)
  }
  const matched = members.filter((m) => {
    const swimmer = m.swimmer
    return selectedTags.every((tag) => {
      if (tag === "level_beginner") return swimmer.level === "初級"
      if (tag === "level_intermediate") return swimmer.level === "中級"
      if (tag === "level_advanced") return swimmer.level === "上級"
      if (tag.startsWith("stroke_")) {
        const labelMap: Record<string, string> = {
          stroke_freestyle: "クロール",
          stroke_backstroke: "背泳ぎ",
          stroke_breaststroke: "平泳ぎ",
          stroke_butterfly: "バタフライ",
          stroke_medley: "個人メドレー",
        }
        const label = labelMap[tag]
        return !!label && !!swimmer.specialties?.includes(label)
      }
      if (tag.startsWith("purpose_")) {
        const labelMap: Record<string, string> = {
          purpose_health: "健康維持",
          purpose_competitive: "競技・タイム向上",
        }
        const label = labelMap[tag]
        return label !== undefined && !!swimmer.swimming_goals?.includes(label)
      }
      if (tag.startsWith("swimmer_type_")) {
        const labelMap: Record<string, string> = {
          swimmer_type_player: "選手",
          swimmer_type_masters: "マスターズ",
        }
        const label = labelMap[tag]
        return label !== undefined && swimmer.swimmer_type === label
      }
      if (tag.startsWith("discipline_")) {
        const labelMap: Record<string, string> = {
          discipline_swimming: "競泳",
          discipline_synchro: "AS（シンクロ）",
          discipline_openwater: "オープンウォーター",
          discipline_diving: "飛び込み",
          discipline_waterpolo: "水球",
        }
        const label = labelMap[tag]
        return label !== undefined && !!swimmer.swim_disciplines?.includes(label)
      }
      return true
    })
  })
  return matched.map((m) => m.swimmer.id)
}
