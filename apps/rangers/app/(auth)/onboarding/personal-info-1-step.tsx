"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { PersonalInfoForm } from "./types"

interface PersonalInfo1StepProps {
  form: PersonalInfoForm
  onChange: (next: PersonalInfoForm) => void
}

export function PersonalInfo1Step({ form, onChange }: PersonalInfo1StepProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          フリガナ<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <Input
          placeholder="ヤマダ ハナコ"
          value={form.furigana}
          onChange={(e) => onChange({ ...form, furigana: e.target.value })}
          className="border-[#dce3ea]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          生年月日<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <div className="flex gap-2">
          <select
            value={form.birthYear}
            onChange={(e) => onChange({ ...form, birthYear: e.target.value })}
            className="flex-1 rounded-lg border border-[#dce3ea] bg-white px-2 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
          >
            <option value="">年</option>
            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 4 - i).map((y) => (
              <option key={y} value={String(y)}>{y}年</option>
            ))}
          </select>
          <select
            value={form.birthMonth}
            onChange={(e) => onChange({ ...form, birthMonth: e.target.value })}
            className="w-24 rounded-lg border border-[#dce3ea] bg-white px-2 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
          >
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m)}>{m}月</option>
            ))}
          </select>
          <select
            value={form.birthDay}
            onChange={(e) => onChange({ ...form, birthDay: e.target.value })}
            className="w-24 rounded-lg border border-[#dce3ea] bg-white px-2 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
          >
            <option value="">日</option>
            {Array.from(
              { length: form.birthYear && form.birthMonth
                ? new Date(Number(form.birthYear), Number(form.birthMonth), 0).getDate()
                : 31 },
              (_, i) => i + 1
            ).map((d) => (
              <option key={d} value={String(d)}>{d}日</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          性別<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <div className="flex gap-3">
          {(["male", "female", "other"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...form, gender: g })}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                form.gender === g
                  ? "border-[#005F8C] bg-[#005F8C]/5 text-[#005F8C]"
                  : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40"
              }`}
            >
              {g === "male" ? "男性" : g === "female" ? "女性" : "その他"}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
