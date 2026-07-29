import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EditableCompetitionField, FormData } from "./types"

interface StepDetailsProps {
  form: FormData
  set: (key: keyof FormData, value: string | boolean) => void
  competitionFields: EditableCompetitionField[]
  setCompetitionFields: (fields: EditableCompetitionField[]) => void
}

export function StepDetails({ form, set, competitionFields, setCompetitionFields }: StepDetailsProps) {
  return (
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
            <span className="text-sm text-[#475569]">日前まで</span>
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

        {/* 試合エントリー設定 */}
        {form.type === "competition" && (
          <div className="space-y-3 rounded-xl border border-[#dce3ea] p-4">
            <p className="text-sm font-semibold text-[#1a2332]">エントリー入力項目</p>
            <p className="text-xs text-[#475569]">参加者が登録時に入力するフィールドを設定します</p>
            {competitionFields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-2 rounded-lg border border-[#dce3ea] bg-white p-3">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => {
                    const updated = [...competitionFields]
                    updated[idx] = { ...field, label: e.target.value, key: e.target.value.replace(/\s/g, "_").toLowerCase() }
                    setCompetitionFields(updated)
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-[#1a2332] outline-none focus-visible:ring-2 focus-visible:ring-[#005F8C] focus-visible:ring-offset-1"
                  placeholder="項目名"
                  aria-label="項目名"
                />
                <label className="flex items-center gap-1 text-xs text-[#475569]">
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
                  className="text-[#c0392b] hover:text-[#c0392b] outline-none focus-visible:ring-2 focus-visible:ring-[#c0392b] focus-visible:ring-offset-1 rounded"
                  aria-label="削除"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCompetitionFields([...competitionFields, { id: crypto.randomUUID(), key: `field_${Date.now()}`, label: "", type: "text", required: false }])}
              className="w-full rounded-lg border border-dashed border-[#dce3ea] py-2 text-sm text-[#005F8C] hover:bg-[#f2f7fa]"
            >
              + 項目を追加
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
