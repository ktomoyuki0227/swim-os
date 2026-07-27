import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DURATION_OPTIONS } from "./form-helpers"
import type { FormData } from "./types"

interface StepBasicInfoProps {
  form: FormData
  set: (key: keyof FormData, value: string | boolean) => void
  setScheduledAt: (value: string) => void
  setDuration: (value: string) => void
}

export function StepBasicInfo({ form, set, setScheduledAt, setDuration }: StepBasicInfoProps) {
  return (
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
            onChange={(e) => setScheduledAt(e.target.value)}
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
              onChange={(e) => setDuration(e.target.value)}
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
                  <p className="mb-0.5 text-[10px] text-[#64748b]">開始</p>
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
                  <p className="mb-0.5 text-[10px] text-[#64748b]">終了</p>
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
          <Label htmlFor="description">
            説明・練習メニュー
            <span className="ml-1.5 text-xs font-normal text-[#64748b]">任意</span>
          </Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={"セッションの概要や練習内容を入力\n\n例）\nウォームアップ 400m\nドリル 4×50m\nメインセット 8×100m..."}
            rows={5}
            className="border-[#dce3ea]"
          />
        </div>
      </CardContent>
    </Card>
  )
}
