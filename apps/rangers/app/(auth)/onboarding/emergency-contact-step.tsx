"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { PersonalInfoForm } from "./types"

interface EmergencyContactStepProps {
  form: PersonalInfoForm
  onChange: (next: PersonalInfoForm) => void
}

export function EmergencyContactStep({ form, onChange }: EmergencyContactStepProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          緊急連絡先 氏名<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <Input
          placeholder="山田 一郎"
          value={form.emergency_contact_name}
          onChange={(e) => onChange({ ...form, emergency_contact_name: e.target.value })}
          className="border-[#dce3ea]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          続柄<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <Input
          placeholder="配偶者・親・兄弟など"
          value={form.emergency_contact_relation}
          onChange={(e) => onChange({ ...form, emergency_contact_relation: e.target.value })}
          className="border-[#dce3ea]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          電話番号<span className="ml-0.5 text-[#c0392b]">*</span>
        </Label>
        <Input
          type="tel"
          placeholder="09012345678"
          value={form.emergency_contact}
          onChange={(e) => onChange({ ...form, emergency_contact: e.target.value })}
          className="border-[#dce3ea]"
        />
        <p className="text-xs text-[#64748b]">ハイフンなし10〜11桁で入力してください</p>
      </div>
    </>
  )
}
