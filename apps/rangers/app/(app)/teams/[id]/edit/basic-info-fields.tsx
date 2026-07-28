"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PRACTICE_FREQUENCIES, PRACTICE_DAYS } from "@/types/database"

interface Team {
  name: string
  description: string | null
  activity_area: string | null
  practice_frequency: string | null
  main_pool: string | null
  contact_email: string | null
  contact_phone: string | null
}

interface BasicInfoFieldsProps {
  team: Team
  practiceDays: string[]
  onPracticeDaysChange: (next: string[]) => void
  isRecruiting: boolean
  onIsRecruitingChange: (next: boolean) => void
  showMemberCount: boolean
  onShowMemberCountChange: (next: boolean) => void
}

export function BasicInfoFields({
  team,
  practiceDays,
  onPracticeDaysChange,
  isRecruiting,
  onIsRecruitingChange,
  showMemberCount,
  onShowMemberCountChange,
}: BasicInfoFieldsProps) {
  return (
    <Card className="border-[#dce3ea]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1a2332]">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">グループ名 <span className="text-[#c0392b]">*</span></Label>
          <Input
            id="name"
            name="name"
            defaultValue={team.name}
            placeholder="例: マウントリバー水泳クラブ"
            maxLength={100}
            required
            className="border-[#dce3ea]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">グループの説明</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={team.description ?? ""}
            placeholder="グループの活動内容や特徴を入力してください"
            rows={3}
            maxLength={2000}
            className="resize-none border-[#dce3ea]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity_area">
            活動エリア
            <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
          </Label>
          <Input
            id="activity_area"
            name="activity_area"
            defaultValue={team.activity_area ?? ""}
            placeholder="例: 東京都渋谷区"
            maxLength={100}
            className="border-[#dce3ea]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="main_pool">
            主な使用プール
            <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
          </Label>
          <Input
            id="main_pool"
            name="main_pool"
            defaultValue={team.main_pool ?? ""}
            placeholder="例: 渋谷区スポーツセンタープール"
            maxLength={200}
            className="border-[#dce3ea]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_email">
            問い合わせ用メールアドレス
            <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
          </Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="例：contact@example.com"
            defaultValue={team.contact_email ?? ""}
            maxLength={254}
            className="border-[#dce3ea]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_phone">
            問い合わせ用電話番号
            <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
          </Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            placeholder="09012345678"
            defaultValue={team.contact_phone ?? ""}
            maxLength={20}
            className="border-[#dce3ea]"
          />
          <p className="text-xs text-[#64748b]">ハイフンなし11桁で入力してください</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="practice_frequency">
            練習ペース
            <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
          </Label>
          <select
            id="practice_frequency"
            name="practice_frequency"
            defaultValue={team.practice_frequency ?? ""}
            className="h-10 w-full rounded-md border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
          >
            <option value="">選択してください</option>
            {PRACTICE_FREQUENCIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>
            練習曜日
            <span className="ml-1 text-xs font-normal text-[#64748b]">（任意・複数選択可）</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_DAYS.map((day) => {
              const checked = practiceDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    onPracticeDaysChange(
                      checked ? practiceDays.filter((d) => d !== day) : [...practiceDays, day]
                    )
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                    checked
                      ? "border-[#005F8C] bg-[#005F8C] text-white"
                      : "border-[#dce3ea] bg-white text-[#475569] hover:border-[#005F8C]/50"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label>メンバー募集</Label>
          <div className="rounded-[10px] border border-[#dce3ea] p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onIsRecruitingChange(!isRecruiting)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  isRecruiting ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    isRecruiting ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[#1a2332]">
                {isRecruiting ? "メンバー募集中" : "募集停止中"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748b]">公開ページに表示されます</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>メンバー数の表示</Label>
          <div className="rounded-[10px] border border-[#dce3ea] p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onShowMemberCountChange(!showMemberCount)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  showMemberCount ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    showMemberCount ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[#1a2332]">
                {showMemberCount ? "表示する" : "表示しない"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748b]">公開ページに「〇人のメンバー」を表示します</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
