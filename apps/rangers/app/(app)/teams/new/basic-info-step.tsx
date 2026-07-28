"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BasicFormData, TeamType } from "./types"

interface BasicInfoStepProps {
  teamType: TeamType
  typeLabel: string
  form: BasicFormData
  onChange: (next: BasicFormData) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export function BasicInfoStep({ teamType, typeLabel, form, onChange, onSubmit, onBack }: BasicInfoStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 選択した種別バッジ */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={teamType === "team"
            ? { backgroundColor: "#e8f2f8", color: "#005F8C" }
            : { backgroundColor: "#eaf7f0", color: "#0f8a4f" }
          }
        >
          {teamType === "team" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
            </svg>
          )}
          {teamType === "team" ? "チーム" : "パーソナル"}
        </span>
      </div>

      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              {typeLabel}名 <span className="text-[#c0392b]">*</span>
            </Label>
            <Input
              id="name" name="name"
              placeholder={teamType === "personal" ? "例: 田中コーチのパーソナルレッスン" : "例: マウントリバー水泳クラブ"}
              defaultValue={form.name}
              maxLength={100} required autoFocus
              className="border-[#dce3ea]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">
              {typeLabel}の説明
              <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
            </Label>
            <Textarea
              id="description" name="description"
              placeholder={teamType === "personal" ? "レッスンの特徴や対象者を入力してください" : "活動内容や特徴を入力してください"}
              defaultValue={form.description}
              rows={4} maxLength={2000}
              className="resize-none border-[#dce3ea]"
            />
          </div>
          {teamType === "personal" && (
            <div className="space-y-1.5">
              <Label htmlFor="instructor_title">
                肩書き
                <span className="ml-1 text-xs font-normal text-[#64748b]">（任意）</span>
              </Label>
              <Input
                id="instructor_title" name="instructor_title"
                placeholder="例: 水泳コーチ"
                defaultValue={form.instructor_title}
                maxLength={100}
                className="border-[#dce3ea]"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>{teamType === "personal" ? "生徒募集" : "メンバー募集"}</Label>
            <div className="flex items-center gap-3 rounded-[10px] border border-[#dce3ea] p-3">
              <button
                type="button"
                onClick={() => onChange({ ...form, is_recruiting: !form.is_recruiting })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  form.is_recruiting ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.is_recruiting ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
              <span className="text-sm font-medium text-[#1a2332]">
                {form.is_recruiting
                  ? (teamType === "personal" ? "生徒募集中" : "メンバー募集中")
                  : "募集停止中"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>メンバー数の表示</Label>
            <div className="flex items-center gap-3 rounded-[10px] border border-[#dce3ea] p-3">
              <button
                type="button"
                onClick={() => onChange({ ...form, show_member_count: !form.show_member_count })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  form.show_member_count ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.show_member_count ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
              <span className="text-sm font-medium text-[#1a2332]">
                {form.show_member_count ? "表示する" : "表示しない"}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">公開ページに「〇人のメンバー」を表示します</p>
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
