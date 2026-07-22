"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createSession, getSession } from "@/actions/sessions"
import { getTeamTemplates, getTemplate } from "@/actions/templates"
import { getTeamMembers, getMyTeams } from "@/actions/teams"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"
import { SYSTEM_TAGS } from "@/types/database"

const STEPS = [
  { label: "基本情報" },
  { label: "参加費" },
  { label: "詳細設定" },
  { label: "配信対象" },
  { label: "確認" },
]

type CompetitionField = {
  key: string
  label: string
  type: "text" | "select" | "number"
  required: boolean
  options?: string[]
}

const DURATION_OPTIONS = [
  { label: "30分", value: "30" },
  { label: "45分", value: "45" },
  { label: "60分", value: "60" },
  { label: "90分", value: "90" },
  { label: "120分", value: "120" },
  { label: "150分", value: "150" },
  { label: "180分", value: "180" },
  { label: "カスタム", value: "custom" },
]

function calcEndAt(scheduledAt: string, durationMinutes: number): string {
  if (!scheduledAt) return ""
  const d = new Date(scheduledAt)
  d.setMinutes(d.getMinutes() + durationMinutes)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type FormData = {
  title: string
  type: string
  scheduled_at: string
  end_at: string
  duration: string
  location: string
  meeting_point: string
  gender_filter: "all" | "male" | "female"
  description: string
  member_price: string
  guest_price: string
  allow_point_card: boolean
  registration_deadline: string
  min_participants: string
  max_participants: string
  cancellation_days: string
  content: string
  is_external: boolean
}

const DEFAULT_FORM: FormData = {
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
  content: "",
  is_external: false,
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const isLast = i === STEPS.length - 1
        return (
          <div key={i} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex w-10 shrink-0 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? "bg-[#005F8C] text-white"
                    : active
                    ? "border-2 border-[#005F8C] bg-white text-[#005F8C]"
                    : "border-2 border-[#dce3ea] bg-white text-[#8d99a8]"
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#005F8C]" : "text-[#8d99a8]"}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`mb-4 h-0.5 flex-1 transition-colors ${done ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function NewSessionForm({
  initialTemplates,
  initialTeamId,
}: {
  initialTemplates: Record<string, unknown>[]
  initialTeamId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const teamId = searchParams.get("team") || ""
  const copySessionId = searchParams.get("copy") || ""
  const templateId = searchParams.get("template") || ""

  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, unknown>[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersLoaded, setMembersLoaded] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [adminTeams, setAdminTeams] = useState<Record<string, unknown>[]>([])
  const [activeTeamId, setActiveTeamId] = useState(initialTeamId || teamId)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [competitionFields, setCompetitionFields] = useState<CompetitionField[]>([
    { key: "event_name", label: "エントリー種目", type: "text", required: true },
    { key: "entry_time", label: "エントリータイム", type: "text", required: true },
    { key: "age_group", label: "年齢区分", type: "text", required: false },
  ])
  const [templates, setTemplates] = useState<Record<string, unknown>[]>(initialTemplates)
  // サーバーで取得済みのグループIDを記憶しておき、同じグループでの再フェッチをスキップする
  const serverFetchedTeamId = useRef(initialTeamId)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [])

  // teamId が URL になければ管理者グループを自動取得
  useEffect(() => {
    if (teamId) {
      setActiveTeamId(teamId)
      return
    }
    getMyTeams().then(({ data }) => {
      const adminOnly = (data || []).filter((t) => (t as Record<string, unknown>).my_role === "admin")
      setAdminTeams(adminOnly)
      if (adminOnly.length === 1) setActiveTeamId((adminOnly[0] as Record<string, unknown>).id as string)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // activeTeamId が変わったらテンプレートを取得（サーバー取得済みの場合はスキップ）
  useEffect(() => {
    if (!activeTeamId) return
    if (activeTeamId === serverFetchedTeamId.current && initialTemplates.length > 0) return
    getTeamTemplates(activeTeamId).then(({ data }) => setTemplates(data || []))
  }, [activeTeamId])

  // step3 になったらメンバーを取得（currentUserId 確定後に実行）
  useEffect(() => {
    if (step !== 3 || !activeTeamId || !currentUserId || membersLoaded || membersLoading) return
    setMembersLoading(true)
    getTeamMembers(activeTeamId).then(({ data }) => {
      const members = (data || []).filter(
        (m) => (m.swimmer as Record<string, unknown>).id !== currentUserId
      )
      setTeamMembers(members)
      setSelectedMemberIds(members.map((m) => (m.swimmer as Record<string, unknown>).id as string))
      setMembersLoaded(true)
      setMembersLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, activeTeamId, currentUserId])

  // タグ変更 → selectedMemberIds をプロフィールフィールドで AND フィルタ
  useEffect(() => {
    if (!membersLoaded) return
    if (selectedTags.length === 0) {
      setSelectedMemberIds(teamMembers.map((m) => (m.swimmer as Record<string, unknown>).id as string))
    } else {
      const matched = teamMembers.filter((m) => {
        const swimmer = m.swimmer as Record<string, unknown>
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
            return label && Array.isArray(swimmer.specialties) && (swimmer.specialties as string[]).includes(label)
          }
          if (tag.startsWith("purpose_")) {
            const labelMap: Record<string, string> = {
              purpose_health: "健康維持",
              purpose_competitive: "競技・タイム向上",
            }
            const label = labelMap[tag]
            return label !== undefined && Array.isArray(swimmer.swimming_goals) && (swimmer.swimming_goals as string[]).includes(label)
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
            return label !== undefined &&
              Array.isArray(swimmer.swim_disciplines) &&
              (swimmer.swim_disciplines as string[]).includes(label)
          }
          return true
        })
      })
      setSelectedMemberIds(matched.map((m) => (m.swimmer as Record<string, unknown>).id as string))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags, membersLoaded])

  type PrefillInput = Partial<Omit<FormData, "member_price" | "guest_price" | "min_participants" | "max_participants" | "cancellation_days">> & {
    member_price?: string | number
    guest_price?: string | number
    min_participants?: string | number
    max_participants?: string | number
    cancellation_days?: string | number
    target_tags?: string[]
    competition_fields?: CompetitionField[]
  }

  const applyPrefill = (data: PrefillInput) => {
    setForm((prev) => ({
      ...prev,
      title: data.title ?? prev.title,
      type: data.type ?? prev.type,
      location: data.location ?? prev.location,
      meeting_point: data.meeting_point ?? prev.meeting_point,
      gender_filter: data.gender_filter ?? prev.gender_filter,
      description: data.description ?? prev.description,
      member_price: data.member_price !== undefined ? String(data.member_price) : prev.member_price,
      guest_price: data.guest_price !== undefined ? String(data.guest_price) : prev.guest_price,
      allow_point_card: data.allow_point_card ?? prev.allow_point_card,
      min_participants: data.min_participants !== undefined ? String(data.min_participants) : prev.min_participants,
      max_participants: data.max_participants !== undefined ? String(data.max_participants) : prev.max_participants,
      cancellation_days: data.cancellation_days !== undefined ? String(data.cancellation_days) : prev.cancellation_days,
      content: data.content ?? prev.content,
      is_external: data.is_external ?? prev.is_external,
    }))
    if (data.target_tags) setSelectedTags(data.target_tags)
    if (data.competition_fields) setCompetitionFields(data.competition_fields)
  }

  useEffect(() => {
    if (copySessionId) {
      getSession(copySessionId).then(({ data }) => {
        if (!data) return
        applyPrefill({
          title: data.title, type: data.type, location: data.location ?? undefined,
          description: data.description ?? undefined, member_price: data.member_price,
          guest_price: data.guest_price, allow_point_card: data.allow_point_card,
          min_participants: data.min_participants ?? undefined, max_participants: data.max_participants ?? undefined,
          cancellation_days: data.cancellation_days ?? undefined, content: data.content ?? undefined,
          is_external: data.is_external, target_tags: (data.target_tags as string[]) ?? [],
          competition_fields: data.competition_fields as CompetitionField[],
        })
      })
    } else if (templateId) {
      getTemplate(templateId).then(({ data }) => {
        if (!data) return
        applyPrefill({
          title: data.title as string, type: data.type as string, location: (data.location as string) ?? undefined,
          description: (data.description as string) ?? undefined, member_price: data.member_price as number,
          guest_price: data.guest_price as number, allow_point_card: data.allow_point_card as boolean,
          min_participants: (data.min_participants as number) ?? undefined, max_participants: (data.max_participants as number) ?? undefined,
          cancellation_days: (data.cancellation_days as number) ?? undefined, content: (data.content as string) ?? undefined,
          is_external: data.is_external as boolean, target_tags: (data.target_tags as string[]) ?? [],
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copySessionId, templateId])

  // 開始日時 or 所要時間が変わったら end_at を自動計算（camp 以外かつ custom 以外）
  useEffect(() => {
    if (form.type === "camp") return
    if (!form.duration || form.duration === "custom") return
    const minutes = parseInt(form.duration, 10)
    if (isNaN(minutes)) return
    const computed = calcEndAt(form.scheduled_at, minutes)
    setForm((prev) => ({ ...prev, end_at: computed }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.scheduled_at, form.duration, form.type])

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return "タイトルを入力してください"
      if (!form.scheduled_at) return "日時を入力してください"
      if (!form.location.trim()) return "場所を入力してください"
    }
    if (step === 2) {
      if (form.registration_deadline && form.scheduled_at) {
        const deadline = new Date(form.registration_deadline)
        const scheduled = new Date(form.scheduled_at)
        if (deadline >= scheduled) return "申込締切は開始日時より前に設定してください"
      }
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { showToast(err, "error"); return }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    setStep((s) => s - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = () => {
    if (!activeTeamId) { showToast("グループが選択されていません", "error"); return }
    startTransition(async () => {
      const result = await createSession(activeTeamId, {
        title: form.title,
        description: form.description || undefined,
        content: form.content || undefined,
        type: form.type as "practice" | "camp" | "competition" | "event" | "meeting",
        scheduled_at: form.scheduled_at,
        end_at: form.end_at || undefined,
        location: form.location,
        meeting_point: form.meeting_point || undefined,
        gender_filter: form.gender_filter,
        member_price: parseInt(form.member_price) || 0,
        guest_price: parseInt(form.guest_price) || 0,
        registration_deadline: form.registration_deadline || undefined,
        min_participants: parseInt(form.min_participants) || undefined,
        max_participants: parseInt(form.max_participants) || undefined,
        cancellation_days: parseInt(form.cancellation_days) || undefined,
        allow_point_card: form.allow_point_card,
        is_external: form.is_external,
        target_tags: selectedTags,
        target_members: selectedMemberIds ?? undefined,
        competition_fields: form.type === "competition" ? competitionFields : undefined,
      })
      if (result.error) {
        showToast(result.error, "error")
      } else if (result.data) {
        showToast("セッションを作成しました", "success")
        router.push(`/sessions/${result.data.id}`)
      }
    })
  }

  const tagsByCategory = SYSTEM_TAGS.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, typeof SYSTEM_TAGS[number][]>)

  return (
    <div className={`mx-auto space-y-6 ${step === 3 ? "max-w-3xl" : "max-w-xl"} transition-all`}>
      {/* ヘッダー */}
      <div>
        <Link href={activeTeamId ? `/teams/${activeTeamId}?tab=sessions` : "/"} className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
          ← セッション管理
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1a2332]">セッションを作成</h1>
      </div>

      {/* テンプレート */}
      {templates.length > 0 && step === 0 && (
        <div className="rounded-xl border border-[#005F8C]/30 bg-[#f2f7fa] p-4">
          <p className="mb-2 text-sm font-medium text-[#005F8C]">テンプレートから作成</p>
          <select
            className="h-10 w-full rounded-lg border border-[#005F8C]/30 bg-white px-3 text-sm text-[#1a2332] focus:outline-none"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return
              getTemplate(e.target.value).then(({ data }) => {
                if (!data) return
                applyPrefill({
                  title: data.title as string, type: data.type as string, location: (data.location as string) ?? undefined,
                  description: (data.description as string) ?? undefined, member_price: data.member_price as number,
                  guest_price: data.guest_price as number, allow_point_card: data.allow_point_card as boolean,
                  min_participants: (data.min_participants as number) ?? undefined, max_participants: (data.max_participants as number) ?? undefined,
                  cancellation_days: (data.cancellation_days as number) ?? undefined, content: (data.content as string) ?? undefined,
                  is_external: data.is_external as boolean, target_tags: (data.target_tags as string[]) ?? [],
                })
              })
            }}
          >
            <option value="">テンプレートを選択...</option>
            {templates.map((t) => (
              <option key={t.id as string} value={t.id as string}>{t.name as string}</option>
            ))}
          </select>
        </div>
      )}

      {/* ステップインジケーター */}
      <StepIndicator current={step} />

      {/* グループ未選択時のピッカー（URL に team なし・複数グループあり） */}
      {!teamId && adminTeams.length > 1 && step === 0 && (
        <div className="rounded-xl border border-[#005F8C]/30 bg-[#f2f7fa] p-4">
          <p className="mb-2 text-sm font-medium text-[#005F8C]">対象グループを選択</p>
          <select
            className="h-10 w-full rounded-lg border border-[#005F8C]/30 bg-white px-3 text-sm text-[#1a2332] focus:outline-none"
            value={activeTeamId}
            onChange={(e) => setActiveTeamId(e.target.value)}
          >
            <option value="">グループを選択...</option>
            {adminTeams.map((t) => (
              <option key={(t as Record<string, unknown>).id as string} value={(t as Record<string, unknown>).id as string}>
                {(t as Record<string, unknown>).name as string}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 0: 基本情報 */}
      {step === 0 && (
        <Card className="border-[#dce3ea]">
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">タイトル <span className="text-[#c0392b]">*</span></Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="例: 水曜朝練 6月"
                maxLength={100}
                className="border-[#dce3ea]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">種類</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
                >
                  <option value="practice">練習</option>
                  <option value="camp">合宿</option>
                  <option value="competition">試合</option>
                  <option value="event">イベント</option>
                  <option value="meeting">ミーティング</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender_filter">対象性別</Label>
                <select
                  id="gender_filter"
                  value={form.gender_filter}
                  onChange={(e) => set("gender_filter", e.target.value as "all" | "male" | "female")}
                  className="h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
                >
                  <option value="all">全員</option>
                  <option value="male">男性のみ</option>
                  <option value="female">女性のみ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduled_at">
                {form.type === "camp" ? "開始日時" : "日時"} <span className="text-[#c0392b]">*</span>
              </Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set("scheduled_at", e.target.value)}
                className="border-[#dce3ea]"
              />
            </div>

            {form.type === "camp" ? (
              <div className="space-y-1.5">
                <Label htmlFor="end_at">終了日時</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => set("end_at", e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="duration">所要時間</Label>
                <select
                  id="duration"
                  value={form.duration}
                  onChange={(e) => {
                    set("duration", e.target.value)
                    if (e.target.value !== "custom") set("end_at", "")
                  }}
                  className="h-10 w-40 rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
                >
                  <option value="">選択しない</option>
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {form.duration && form.duration !== "custom" && form.end_at && form.scheduled_at && (
                  <div className="flex items-center gap-3 rounded-xl border border-[#005F8C]/15 bg-[#005F8C]/5 px-4 py-3">
                    <div className="text-center">
                      <p className="mb-0.5 text-[10px] text-[#8d99a8]">開始</p>
                      <p className="text-base font-semibold tabular-nums text-[#1a2332]">
                        {new Date(form.scheduled_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-px flex-1 bg-[#005F8C]/25" />
                      <span className="rounded-full border border-[#005F8C]/20 bg-white px-2.5 py-0.5 text-xs font-medium text-[#005F8C]">
                        {form.duration}分
                      </span>
                      <div className="h-px flex-1 bg-[#005F8C]/25" />
                    </div>
                    <div className="text-center">
                      <p className="mb-0.5 text-[10px] text-[#8d99a8]">終了</p>
                      <p className="text-base font-semibold tabular-nums text-[#1a2332]">
                        {new Date(form.end_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )}

                {form.duration === "custom" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="end_at_custom">終了日時</Label>
                    <Input
                      id="end_at_custom"
                      type="datetime-local"
                      value={form.end_at}
                      onChange={(e) => set("end_at", e.target.value)}
                      className="border-[#dce3ea]"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="location">場所 <span className="text-[#c0392b]">*</span></Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="例: ○○市民プール"
                maxLength={200}
                className="border-[#dce3ea]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meeting_point">待ち合わせ場所</Label>
              <Input
                id="meeting_point"
                value={form.meeting_point}
                onChange={(e) => set("meeting_point", e.target.value)}
                placeholder="例: 正面玄関前"
                maxLength={200}
                className="border-[#dce3ea]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="セッションの概要を入力"
                rows={2}
                className="resize-none border-[#dce3ea]"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: 参加費 */}
      {step === 1 && (
        <Card className="border-[#dce3ea]">
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="member_price">メンバー参加費</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                  <Input
                    id="member_price"
                    type="number"
                    min="0"
                    step="100"
                    value={form.member_price}
                    onChange={(e) => set("member_price", e.target.value)}
                    className="border-[#dce3ea] pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest_price">ゲスト参加費</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                  <Input
                    id="guest_price"
                    type="number"
                    min="0"
                    step="100"
                    value={form.guest_price}
                    onChange={(e) => set("guest_price", e.target.value)}
                    className={`border-[#dce3ea] pl-7 transition-opacity ${!form.is_external ? "opacity-40" : ""}`}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => set("allow_point_card", !form.allow_point_card)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                form.allow_point_card
                  ? "border-[#005F8C]/30 bg-[#e8f2f8] text-[#005F8C]"
                  : "border-[#dce3ea] bg-[#f2f7fa] text-[#5c6a7a]"
              }`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                form.allow_point_card ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"
              }`}>
                {form.allow_point_card && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              回数券での参加を許可する
            </button>

            <button
              type="button"
              onClick={() => set("is_external", !form.is_external)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                form.is_external
                  ? "border-[#005F8C]/30 bg-[#e8f2f8] text-[#005F8C]"
                  : "border-[#dce3ea] bg-[#f2f7fa] text-[#5c6a7a]"
              }`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                form.is_external ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"
              }`}>
                {form.is_external && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              外部公開する（メンバー以外も参加可能）
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 詳細設定 */}
      {step === 2 && (
        <Card className="border-[#dce3ea]">
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="registration_deadline">申込み締め切り</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={form.registration_deadline}
                onChange={(e) => set("registration_deadline", e.target.value)}
                className="border-[#dce3ea]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="min_participants">最低参加人数</Label>
                <Input
                  id="min_participants"
                  type="number"
                  min="0"
                  placeholder="未設定"
                  value={form.min_participants}
                  onChange={(e) => set("min_participants", e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_participants">定員（最大参加人数）</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  placeholder="未設定"
                  value={form.max_participants}
                  onChange={(e) => set("max_participants", e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancellation_days">キャンセル期限</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellation_days"
                  type="number"
                  min="0"
                  max="30"
                  placeholder="未設定"
                  value={form.cancellation_days}
                  onChange={(e) => set("cancellation_days", e.target.value)}
                  className="w-28 border-[#dce3ea]"
                />
                <span className="text-sm text-[#5c6a7a]">日前まで</span>
                {form.cancellation_days && form.scheduled_at && (() => {
                  const deadline = new Date(form.scheduled_at)
                  deadline.setDate(deadline.getDate() - parseInt(form.cancellation_days))
                  return (
                    <span className="ml-auto text-sm font-medium text-[#005F8C]">
                      {deadline.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}まで
                    </span>
                  )
                })()}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">練習メニュー・内容</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder={"ウォームアップ 400m\nドリル 4×50m\n..."}
                rows={5}
                className="resize-none border-[#dce3ea] font-mono text-sm"
              />
            </div>

            {/* 試合エントリー設定 */}
            {form.type === "competition" && (
              <div className="space-y-3 rounded-xl border border-[#dce3ea] p-4">
                <p className="text-sm font-semibold text-[#1a2332]">エントリー入力項目</p>
                <p className="text-xs text-[#5c6a7a]">参加者が登録時に入力するフィールドを設定します</p>
                {competitionFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#dce3ea] bg-white p-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => {
                        const updated = [...competitionFields]
                        updated[idx] = { ...field, label: e.target.value, key: e.target.value.replace(/\s/g, "_").toLowerCase() }
                        setCompetitionFields(updated)
                      }}
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-[#1a2332] outline-none"
                      placeholder="項目名"
                    />
                    <label className="flex items-center gap-1 text-xs text-[#5c6a7a]">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const updated = [...competitionFields]
                          updated[idx] = { ...field, required: e.target.checked }
                          setCompetitionFields(updated)
                        }}
                        className="h-3.5 w-3.5"
                      />
                      必須
                    </label>
                    <button
                      type="button"
                      onClick={() => setCompetitionFields(competitionFields.filter((_, i) => i !== idx))}
                      className="text-[#c0392b] hover:text-[#c0392b]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCompetitionFields([...competitionFields, { key: `field_${Date.now()}`, label: "", type: "text", required: false }])}
                  className="w-full rounded-lg border border-dashed border-[#dce3ea] py-2 text-sm text-[#005F8C] hover:bg-[#f2f7fa]"
                >
                  + 項目を追加
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: 配信対象 */}
      {step === 3 && (() => {
        const sortedMembers = [...teamMembers].sort((a, b) => {
          const aId = (a.swimmer as Record<string, unknown>).id as string
          const bId = (b.swimmer as Record<string, unknown>).id as string
          const aChecked = selectedMemberIds.includes(aId)
          const bChecked = selectedMemberIds.includes(bId)
          if (aChecked && !bChecked) return -1
          if (!aChecked && bChecked) return 1
          return ((a.swimmer as Record<string, unknown>).name as string).localeCompare(
            (b.swimmer as Record<string, unknown>).name as string, "ja"
          )
        })
        const untaggedCount = teamMembers.filter((m) => {
          const sw = m.swimmer as Record<string, unknown>
          return (
            !sw?.level &&
            ((sw?.specialties as string[]) || []).length === 0 &&
            ((sw?.swimming_goals as string[]) || []).length === 0 &&
            !sw?.swimmer_type &&
            ((sw?.swim_disciplines as string[]) || []).length === 0
          )
        }).length
        const allChecked = teamMembers.length > 0 && teamMembers.every(
          (m) => selectedMemberIds.includes((m.swimmer as Record<string, unknown>).id as string)
        )

        return (
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <Card className="border-[#dce3ea]">
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs font-semibold text-[#5c6a7a]">タグで絞り込む</p>
                <p className="text-xs text-[#8d99a8] leading-relaxed">タグを選ぶほどチェックが絞られます</p>
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div key={category}>
                    <p className="mb-2 text-xs font-medium text-[#8d99a8]">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                            )
                          }
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            selectedTags.includes(tag.id)
                              ? "bg-[#005F8C] text-white"
                              : "border border-[#dce3ea] bg-white text-[#5c6a7a] hover:border-[#005F8C] hover:text-[#005F8C]"
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-[#c0392b] hover:underline"
                  >
                    リセット（全員選択に戻す）
                  </button>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#dce3ea]">
              <CardContent className="pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#5c6a7a]">
                      メンバー一覧（{selectedMemberIds.length}/{teamMembers.length}人 選択中）
                    </p>
                    {untaggedCount > 0 && (
                      <p className="mt-0.5 text-xs text-[#8d99a8]">※ タグ未設定 {untaggedCount}人あり</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (allChecked) {
                        setSelectedMemberIds([])
                      } else {
                        setSelectedMemberIds(teamMembers.map((m) => (m.swimmer as Record<string, unknown>).id as string))
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      allChecked
                        ? "bg-[#005F8C] text-white"
                        : "border border-[#dce3ea] bg-white text-[#5c6a7a] hover:border-[#005F8C]"
                    }`}
                  >
                    {allChecked ? "全解除" : "全選択"}
                  </button>
                </div>

                {membersLoading ? (
                  <p className="py-8 text-center text-sm text-[#8d99a8]">読み込み中...</p>
                ) : teamMembers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#8d99a8]">メンバーがいません</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {sortedMembers.map((m) => {
                      const swimmer = m.swimmer as Record<string, unknown>
                      const id = swimmer.id as string
                      const isChecked = selectedMemberIds.includes(id)
                      const memberTagLabels = [
                        swimmer.level as string | undefined,
                        ...((swimmer.specialties as string[]) || []).slice(0, 2),
                      ].filter(Boolean)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setSelectedMemberIds((prev) =>
                              isChecked ? prev.filter((x) => x !== id) : [...prev, id]
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                            isChecked ? "bg-[#e8f2f8]" : "opacity-50 hover:opacity-80 hover:bg-[#f2f7fa]"
                          }`}
                        >
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            isChecked ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"
                          }`}>
                            {isChecked && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-bold text-[#005F8C]">
                            {(swimmer.name as string)?.[0] || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#1a2332]">{swimmer.name as string}</p>
                            {memberTagLabels.length > 0 && (
                              <p className="truncate text-xs text-[#8d99a8]">{memberTagLabels.join(" · ")}</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })()}

      {/* Step 4: 確認 */}
      {step === 4 && (
        <Card className="border-[#dce3ea]">
          <CardContent className="space-y-5 pt-5">
            <p className="text-sm text-[#5c6a7a]">以下の内容でセッションを作成します。確認してください。</p>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#8d99a8] uppercase tracking-wide">基本情報</p>
              <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">タイトル</span>
                  <span className="font-medium text-[#1a2332]">{form.title}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">種類</span>
                  <span className="text-[#1a2332]">{({"practice": "練習", "camp": "合宿", "competition": "試合", "event": "イベント", "meeting": "ミーティング"} as Record<string, string>)[form.type] || form.type}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">{form.type === "camp" ? "開始日時" : "日時"}</span>
                  <span className="text-[#1a2332]">{form.scheduled_at ? new Date(form.scheduled_at).toLocaleString("ja-JP") : "—"}</span>
                </div>
                {form.end_at && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">終了日時</span>
                    <span className="text-[#1a2332]">{new Date(form.end_at).toLocaleString("ja-JP")}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">場所</span>
                  <span className="text-[#1a2332]">{form.location}</span>
                </div>
                {form.meeting_point && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">待ち合わせ</span>
                    <span className="text-[#1a2332]">{form.meeting_point}</span>
                  </div>
                )}
                {form.gender_filter !== "all" && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">対象性別</span>
                    <span className="text-[#1a2332]">{form.gender_filter === "male" ? "男性のみ" : "女性のみ"}</span>
                  </div>
                )}
                {form.description && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">説明</span>
                    <span className="text-[#1a2332]">{form.description}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#8d99a8] uppercase tracking-wide">参加費</p>
              <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">メンバー</span>
                  <span className="text-[#1a2332]">¥{parseInt(form.member_price || "0").toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">ゲスト</span>
                  <span className="text-[#1a2332]">¥{parseInt(form.guest_price || "0").toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">回数券</span>
                  <span className="text-[#1a2332]">{form.allow_point_card ? "利用可" : "利用不可"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#8d99a8] uppercase tracking-wide">詳細設定</p>
              <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
                {form.registration_deadline && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">申込締切</span>
                    <span className="text-[#1a2332]">{new Date(form.registration_deadline).toLocaleDateString("ja-JP")}</span>
                  </div>
                )}
                {form.min_participants && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">最低人数</span>
                    <span className="text-[#1a2332]">{form.min_participants}人</span>
                  </div>
                )}
                {form.max_participants && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">定員</span>
                    <span className="text-[#1a2332]">{form.max_participants}人</span>
                  </div>
                )}
                {form.cancellation_days && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">キャンセル期限</span>
                    <span className="text-[#1a2332]">{form.cancellation_days}日前まで</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">外部公開</span>
                  <span className="text-[#1a2332]">{form.is_external ? "あり" : "なし"}</span>
                </div>
              </div>
            </div>

            {form.type === "competition" && competitionFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#8d99a8] uppercase tracking-wide">エントリー項目</p>
                <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-1.5">
                  {competitionFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[#1a2332]">{f.label || "（未入力）"}</span>
                      {f.required && (
                        <span className="rounded-full bg-[#fdecea] px-1.5 py-0.5 text-xs font-medium text-[#c0392b]">必須</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#8d99a8] uppercase tracking-wide">配信対象</p>
              <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
                {selectedTags.length > 0 && (
                  <div className="flex gap-2">
                    <span className="w-24 shrink-0 text-[#8d99a8]">タグ絞込</span>
                    <span className="text-[#1a2332]">
                      {selectedTags.map((t) => SYSTEM_TAGS.find((s) => s.id === t)?.label || t).join("、")}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="w-24 shrink-0 text-[#8d99a8]">選択人数</span>
                  <span className="text-[#1a2332]">
                    {selectedMemberIds.length === teamMembers.length
                      ? `全メンバー（${teamMembers.length}人）`
                      : `${selectedMemberIds.length}人を選択`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex gap-3">
        {step === 0 ? (
          <Link href={activeTeamId ? `/teams/${activeTeamId}?tab=sessions` : "/"} className="flex-1">
            <Button type="button" variant="outline" className="w-full rounded-full border-[#dce3ea] text-[#5c6a7a]" style={{ minHeight: "48px" }}>
              キャンセル
            </Button>
          </Link>
        ) : (
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1 rounded-full border-[#dce3ea] text-[#5c6a7a]" style={{ minHeight: "48px" }}>
            ← 戻る
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "48px" }}>
            次へ →
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isPending || !activeTeamId} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "48px" }}>
            {isPending ? "作成中..." : "セッションを作成"}
          </Button>
        )}
      </div>
    </div>
  )
}
