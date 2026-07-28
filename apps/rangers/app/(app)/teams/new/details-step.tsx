"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PRACTICE_FREQUENCIES, PRACTICE_DAYS } from "@/types/database"
import type { BasicFormData } from "./types"

interface DetailsStepProps {
  form: BasicFormData
  onChange: (next: BasicFormData) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export function DetailsStep({ form, onChange, onSubmit, onBack }: DetailsStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-4 pt-5">
          <div>
            <p className="text-sm font-semibold text-[#1a2332]">詳細設定</p>
            <p className="mt-0.5 text-xs text-[#475569]">すべて任意です。後から変更できます。</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity_area">活動エリア</Label>
            <Input id="activity_area" name="activity_area" placeholder="例: 東京都渋谷区" defaultValue={form.activity_area} maxLength={100} className="border-[#dce3ea]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="main_pool">主な使用プール</Label>
            <Input id="main_pool" name="main_pool" placeholder="例: 渋谷区スポーツセンタープール" defaultValue={form.main_pool} maxLength={200} className="border-[#dce3ea]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="practice_frequency">練習ペース</Label>
            <select
              id="practice_frequency" name="practice_frequency"
              defaultValue={form.practice_frequency}
              className="h-10 w-full rounded-md border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
            >
              <option value="">選択してください</option>
              {PRACTICE_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>練習曜日<span className="ml-1 text-xs font-normal text-[#64748b]">（複数選択可）</span></Label>
            <div className="flex flex-wrap gap-2">
              {PRACTICE_DAYS.map((day) => {
                const checked = form.practice_days.includes(day)
                return (
                  <button
                    key={day} type="button"
                    onClick={() => onChange({
                      ...form,
                      practice_days: checked ? form.practice_days.filter((d) => d !== day) : [...form.practice_days, day],
                    })}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                      checked ? "border-[#005F8C] bg-[#005F8C] text-white" : "border-[#dce3ea] bg-white text-[#475569] hover:border-[#005F8C]/50"
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">問い合わせ用メールアドレス</Label>
            <Input id="contact_email" name="contact_email" type="email" placeholder="例：contact@example.com" defaultValue={form.contact_email} maxLength={254} className="border-[#dce3ea]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">問い合わせ用電話番号</Label>
            <Input id="contact_phone" name="contact_phone" type="tel" placeholder="09012345678" defaultValue={form.contact_phone} maxLength={20} className="border-[#dce3ea]" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full border-[#dce3ea] text-[#475569]" style={{ minHeight: 48 }}>
          ← 戻る
        </Button>
        <Button type="submit" className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: 48 }}>
          次へ →
        </Button>
      </div>
    </form>
  )
}
