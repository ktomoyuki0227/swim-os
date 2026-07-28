"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { PersonalInfoForm } from "./types"

interface CompetitionRegistrationStepProps {
  form: PersonalInfoForm
  onChange: (next: PersonalInfoForm) => void
}

export function CompetitionRegistrationStep({ form, onChange }: CompetitionRegistrationStepProps) {
  return (
    <>
      <div className="space-y-3 rounded-xl border border-[#dce3ea] p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...form, masters_registered: !form.masters_registered })}
            className={`relative h-6 w-10 rounded-full transition-colors ${form.masters_registered ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.masters_registered ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <span className="text-sm font-medium text-[#1a2332]">マスターズ水泳に登録済み</span>
        </div>
        {form.masters_registered && (
          <div className="space-y-1.5">
            <Label className="text-sm text-[#475569]">
              マスターズ登録番号<span className="ml-0.5 text-[#c0392b]">*</span>
            </Label>
            <Input
              placeholder="登録番号を入力"
              value={form.masters_number}
              onChange={(e) => onChange({ ...form, masters_number: e.target.value })}
              className="border-[#dce3ea]"
            />
          </div>
        )}
      </div>
      <div className="space-y-3 rounded-xl border border-[#dce3ea] p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...form, jsa_registered: !form.jsa_registered })}
            className={`relative h-6 w-10 rounded-full transition-colors ${form.jsa_registered ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.jsa_registered ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <span className="text-sm font-medium text-[#1a2332]">日本水泳連盟（JSA）に登録済み</span>
        </div>
        {form.jsa_registered && (
          <div className="space-y-1.5">
            <Label className="text-sm text-[#475569]">
              JSA登録番号<span className="ml-0.5 text-[#c0392b]">*</span>
            </Label>
            <Input
              placeholder="登録番号を入力"
              value={form.jsa_number}
              onChange={(e) => onChange({ ...form, jsa_number: e.target.value })}
              className="border-[#dce3ea]"
            />
          </div>
        )}
      </div>
    </>
  )
}
