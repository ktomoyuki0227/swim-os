"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateSession } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"
import { SYSTEM_TAGS } from "@/types/database"

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

function utcToJstInput(utcIso: string | null | undefined): string {
  if (!utcIso) return ""
  const d = new Date(utcIso)
  const jstMs = d.getTime() + 9 * 60 * 60 * 1000
  const jst = new Date(jstMs)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
}

function calcEndAt(scheduledAt: string, durationMinutes: number): string {
  if (!scheduledAt) return ""
  const d = new Date(scheduledAt)
  d.setMinutes(d.getMinutes() + durationMinutes)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function detectDuration(scheduledAt: string, endAt: string): string {
  if (!scheduledAt || !endAt) return ""
  const diffMs = new Date(endAt).getTime() - new Date(scheduledAt).getTime()
  const mins = Math.round(diffMs / 60000)
  const found = DURATION_OPTIONS.find((o) => o.value !== "custom" && parseInt(o.value) === mins)
  return found ? found.value : "custom"
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
  is_external: boolean
}

interface EditSessionFormProps {
  session: Record<string, unknown>
  teamId: string
  teamName: string
}

export function EditSessionForm({ session, teamId, teamName }: EditSessionFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()

  const sessionId = session.id as string
  const isConfirmed = session.session_status === "confirmed"
  const isCamp = session.type === "camp"

  const jstScheduledAt = utcToJstInput(session.scheduled_at as string)
  const jstEndAt = utcToJstInput(session.end_at as string | null)
  const jstDeadline = utcToJstInput(session.registration_deadline as string | null)

  const [form, setForm] = useState<FormData>({
    title: (session.title as string) || "",
    type: (session.type as string) || "practice",
    scheduled_at: jstScheduledAt,
    end_at: jstEndAt,
    duration: isCamp ? "" : detectDuration(jstScheduledAt, jstEndAt),
    location: (session.location as string) || "",
    meeting_point: (session.meeting_point as string) || "",
    gender_filter: (session.gender_filter as "all" | "male" | "female") || "all",
    description: (session.description as string) || "",
    member_price: String(session.member_price ?? 0),
    guest_price: String(session.guest_price ?? 0),
    allow_point_card: (session.allow_point_card as boolean) ?? true,
    registration_deadline: jstDeadline,
    min_participants: session.min_participants != null ? String(session.min_participants) : "",
    max_participants: session.max_participants != null ? String(session.max_participants) : "",
    cancellation_days: session.cancellation_days != null ? String(session.cancellation_days) : "",
    is_external: (session.is_external as boolean) ?? false,
  })

  const [selectedTags, setSelectedTags] = useState<string[]>(
    (session.target_tags as string[]) || []
  )
  const [competitionFields, setCompetitionFields] = useState<CompetitionField[]>(
    (session.competition_fields as CompetitionField[]) || []
  )

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // duration → end_at 自動計算（camp・custom 以外）
  useEffect(() => {
    if (form.type === "camp") return
    if (!form.duration || form.duration === "custom") return
    const minutes = parseInt(form.duration, 10)
    if (isNaN(minutes)) return
    const computed = calcEndAt(form.scheduled_at, minutes)
    setForm((prev) => ({ ...prev, end_at: computed }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.scheduled_at, form.duration, form.type])

  const tagsByCategory = SYSTEM_TAGS.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, typeof SYSTEM_TAGS[number][]>)

  const handleSubmit = () => {
    if (!form.title.trim()) { showToast("タイトルを入力してください", "error"); return }
    if (!form.scheduled_at) { showToast("日時を入力してください", "error"); return }
    if (!form.location.trim()) { showToast("場所を入力してください", "error"); return }
    if (form.registration_deadline && form.scheduled_at) {
      const deadline = new Date(form.registration_deadline)
      const scheduled = new Date(form.scheduled_at)
      if (deadline >= scheduled) {
        showToast("申込締切は開始日時より前に設定してください", "error")
        return
      }
    }

    startTransition(async () => {
      const result = await updateSession(sessionId, {
        title: form.title,
        description: form.description || undefined,
        type: form.type as "practice" | "camp" | "competition" | "event" | "meeting",
        scheduled_at: form.scheduled_at,
        end_at: form.end_at || undefined,
        location: form.location,
        meeting_point: form.meeting_point || undefined,
        gender_filter: form.gender_filter,
        member_price: isConfirmed ? undefined : (parseInt(form.member_price) || 0),
        guest_price: isConfirmed ? undefined : (parseInt(form.guest_price) || 0),
        registration_deadline: form.registration_deadline || undefined,
        min_participants: parseInt(form.min_participants) || undefined,
        max_participants: parseInt(form.max_participants) || undefined,
        cancellation_days: parseInt(form.cancellation_days) || undefined,
        allow_point_card: form.allow_point_card,
        is_external: form.is_external,
        target_tags: selectedTags,
        competition_fields: form.type === "competition" ? competitionFields : undefined,
      })
      if (result.error) {
        showToast(result.error, "error")
      } else {
        showToast("セッションを更新しました", "success")
        router.push(`/sessions/${sessionId}`)
      }
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* ヘッダー */}
      <div>
        <Link href={`/sessions/${sessionId}`} className="text-sm text-[#475569] hover:text-[#1a2332]">
          ← セッション詳細に戻る
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[#1a2332]">セッションを編集</h1>
        <p className="text-sm text-[#475569]">{teamName}</p>
      </div>

      {isConfirmed && (
        <div className="rounded-xl border border-[#b8860b]/30 bg-[#fdf6e3] px-4 py-3 text-sm text-[#b8860b]">
          開催確定済みのため、参加費は変更できません。
        </div>
      )}

      {/* 基本情報 */}
      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm font-semibold text-[#005F8C]">基本情報</p>

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
            <div className="space-y-1.5">
              <Label htmlFor="duration">所要時間</Label>
              <select
                id="duration"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                className="h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
              >
                <option value="">未設定</option>
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {form.duration === "custom" && (
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => set("end_at", e.target.value)}
                  placeholder="終了日時"
                  className="mt-2 border-[#dce3ea]"
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="location">場所 <span className="text-[#c0392b]">*</span></Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="例: ○○スポーツセンター"
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
              placeholder="セッションの説明を入力してください"
              rows={3}
              maxLength={2000}
              className="border-[#dce3ea]"
            />
          </div>
        </CardContent>
      </Card>

      {/* 参加費 */}
      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm font-semibold text-[#005F8C]">参加費</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="member_price">メンバー参加費（円）</Label>
              <Input
                id="member_price"
                type="number"
                min={0}
                value={form.member_price}
                onChange={(e) => set("member_price", e.target.value)}
                disabled={isConfirmed}
                className="border-[#dce3ea] disabled:bg-[#f2f7fa] disabled:text-[#64748b]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest_price">ゲスト参加費（円）</Label>
              <Input
                id="guest_price"
                type="number"
                min={0}
                value={form.guest_price}
                onChange={(e) => set("guest_price", e.target.value)}
                disabled={isConfirmed}
                className="border-[#dce3ea] disabled:bg-[#f2f7fa] disabled:text-[#64748b]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("allow_point_card", !form.allow_point_card)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${form.allow_point_card ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${form.allow_point_card ? "translate-x-5" : "translate-x-0.5"} mt-0.5`}
              />
            </button>
            <Label className="cursor-pointer" onClick={() => set("allow_point_card", !form.allow_point_card)}>
              回数券払いを許可
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("is_external", !form.is_external)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${form.is_external ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${form.is_external ? "translate-x-5" : "translate-x-0.5"} mt-0.5`}
              />
            </button>
            <Label className="cursor-pointer" onClick={() => set("is_external", !form.is_external)}>
              外部への公開（料金を一般公開）
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 詳細設定 */}
      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm font-semibold text-[#005F8C]">詳細設定</p>

          <div className="space-y-1.5">
            <Label htmlFor="registration_deadline">申込締切</Label>
            <Input
              id="registration_deadline"
              type="datetime-local"
              value={form.registration_deadline}
              onChange={(e) => set("registration_deadline", e.target.value)}
              className="border-[#dce3ea]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="min_participants">最小催行人数</Label>
              <Input
                id="min_participants"
                type="number"
                min={0}
                value={form.min_participants}
                onChange={(e) => set("min_participants", e.target.value)}
                placeholder="人数"
                className="border-[#dce3ea]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_participants">最大参加人数</Label>
              <Input
                id="max_participants"
                type="number"
                min={1}
                value={form.max_participants}
                onChange={(e) => set("max_participants", e.target.value)}
                placeholder="人数"
                className="border-[#dce3ea]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cancellation_days">キャンセル期限（何日前まで）</Label>
            <Input
              id="cancellation_days"
              type="number"
              min={0}
              value={form.cancellation_days}
              onChange={(e) => set("cancellation_days", e.target.value)}
              placeholder="例: 3"
              className="border-[#dce3ea]"
            />
          </div>
        </CardContent>
      </Card>

      {/* 配信タグ */}
      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm font-semibold text-[#005F8C]">配信対象タグ</p>
          <p className="text-sm text-[#64748b]">タグを選ぶと、該当するメンバーにのみ通知されます（空の場合は全員）</p>
          {Object.entries(tagsByCategory).map(([category, tags]) => (
            <div key={category}>
              <p className="mb-1.5 text-sm font-medium text-[#475569]">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          active ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                        )
                      }
                      className={`rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-[#005F8C] bg-[#005F8C] text-white"
                          : "border-[#dce3ea] bg-white text-[#475569] hover:border-[#005F8C]"
                      }`}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 大会フィールド（競技系のみ） */}
      {form.type === "competition" && competitionFields.length > 0 && (
        <Card className="border-[#dce3ea]">
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm font-semibold text-[#005F8C]">エントリーフィールド</p>
            <p className="text-sm text-[#64748b]">参加者が入力するフィールドの設定です</p>
            <div className="space-y-2">
              {competitionFields.map((field, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-[#dce3ea] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1a2332]">{field.label}</p>
                    <p className="text-sm text-[#64748b]">{field.type}{field.required ? " · 必須" : ""}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompetitionFields((prev) => prev.filter((_, j) => j !== i))}
                    className="text-[#64748b] hover:text-[#c0392b]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 送信ボタン */}
      <div className="flex gap-3 pb-8">
        <Link href={`/sessions/${sessionId}`} className="flex-1">
          <Button
            variant="outline"
            className="w-full rounded-full border-[#dce3ea] text-[#475569]"
            style={{ minHeight: "48px" }}
          >
            キャンセル
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-full bg-[#005F8C] text-white hover:bg-[#004E73]"
          style={{ minHeight: "48px" }}
        >
          {isPending ? "保存中..." : "変更を保存"}
        </Button>
      </div>
    </div>
  )
}
