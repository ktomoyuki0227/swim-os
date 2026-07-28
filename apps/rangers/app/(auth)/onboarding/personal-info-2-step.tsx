"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { PersonalInfoForm } from "./types"

interface PersonalInfo2StepProps {
  form: PersonalInfoForm
  onChange: (next: PersonalInfoForm) => void
}

export function PersonalInfo2Step({ form, onChange }: PersonalInfo2StepProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          住所<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <Textarea
          placeholder="東京都渋谷区〇〇 1-2-3"
          value={form.address}
          onChange={(e) => onChange({ ...form, address: e.target.value })}
          className="border-[#dce3ea]"
          rows={3}
        />
        <p className="text-xs text-[#64748b]">グループからの郵便物等に使用される場合があります</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          電話番号<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <Input
          type="tel"
          placeholder="09012345678"
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
          className="border-[#dce3ea]"
        />
        <p className="text-xs text-[#64748b]">ハイフンなし10〜11桁で入力してください</p>
      </div>
    </>
  )
}
