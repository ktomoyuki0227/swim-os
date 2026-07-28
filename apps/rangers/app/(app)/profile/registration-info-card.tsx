"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileRow, EditActions, SectionHeader, Toggle } from "./profile-ui"
import type { RegistrationForm } from "./profile-sections"

interface RegistrationInfoCardProps {
  isLoading: boolean
  isEditing: boolean
  canEdit: boolean
  isPending: boolean
  form: RegistrationForm
  onChange: (next: RegistrationForm) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function RegistrationInfoCard({
  isLoading,
  isEditing,
  canEdit,
  isPending,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: RegistrationInfoCardProps) {
  return (
    <Card className={`border-[#dce3ea] transition-shadow ${isEditing ? "ring-2 ring-[#005F8C]/20" : ""}`}>
      <CardHeader className="pb-2">
        <SectionHeader title="登録情報" privacy="private" isEditingThis={isEditing} canEdit={canEdit} onEdit={onEdit} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isEditing ? (
          <div className="space-y-5">
            {/* マスターズ */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Toggle checked={form.mastersRegistered} onChange={(mastersRegistered) => onChange({ ...form, mastersRegistered })} />
                <span className="text-sm font-medium text-[#1a2332]">マスターズ登録あり</span>
              </label>
              {form.mastersRegistered && (
                <div className="space-y-1.5 pl-14">
                  <Label htmlFor="masters_number" className="text-sm text-[#475569]">登録番号</Label>
                  <Input id="masters_number" value={form.mastersNumber} onChange={(e) => onChange({ ...form, mastersNumber: e.target.value })} placeholder="登録番号" className="border-[#dce3ea]" />
                </div>
              )}
            </div>
            <div className="border-t border-[#dce3ea]" />
            {/* JSA */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Toggle checked={form.jsaRegistered} onChange={(jsaRegistered) => onChange({ ...form, jsaRegistered })} />
                <span className="text-sm font-medium text-[#1a2332]">日本水泳連盟登録あり</span>
              </label>
              {form.jsaRegistered && (
                <div className="space-y-1.5 pl-14">
                  <Label htmlFor="jsa_number" className="text-sm text-[#475569]">登録番号</Label>
                  <Input id="jsa_number" value={form.jsaNumber} onChange={(e) => onChange({ ...form, jsaNumber: e.target.value })} placeholder="登録番号" className="border-[#dce3ea]" />
                </div>
              )}
            </div>
            <div className="border-t border-[#dce3ea]" />
            {/* 水着サイズ */}
            <div className="space-y-1.5">
              <Label htmlFor="swimwear_size" className="text-sm text-[#475569]">水着サイズ</Label>
              <Input id="swimwear_size" value={form.swimwearSize} onChange={(e) => onChange({ ...form, swimwearSize: e.target.value })} placeholder="例: S・M・L・XL" className="border-[#dce3ea]" />
            </div>
            <EditActions onCancel={onCancel} onSave={onSave} isPending={isPending} />
          </div>
        ) : (
          <div>
            <ProfileRow label="マスターズ" value={form.mastersRegistered ? "登録あり" : "未登録"} muted={!form.mastersRegistered} />
            {form.mastersRegistered && <ProfileRow label="登録番号" value={form.mastersNumber || null} />}
            <ProfileRow label="日本水泳連盟" value={form.jsaRegistered ? "登録あり" : "未登録"} muted={!form.jsaRegistered} />
            {form.jsaRegistered && <ProfileRow label="登録番号" value={form.jsaNumber || null} />}
            <ProfileRow label="水着サイズ" value={form.swimwearSize || null} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
