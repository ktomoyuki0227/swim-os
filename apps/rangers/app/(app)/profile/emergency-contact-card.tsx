"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileRow, EditActions, SectionHeader } from "./profile-ui"
import type { EmergencyForm } from "./profile-sections"

interface EmergencyContactCardProps {
  isLoading: boolean
  isEditing: boolean
  canEdit: boolean
  isPending: boolean
  form: EmergencyForm
  onChange: (next: EmergencyForm) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function EmergencyContactCard({
  isLoading,
  isEditing,
  canEdit,
  isPending,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: EmergencyContactCardProps) {
  return (
    <Card className={`border-[#dce3ea] transition-shadow ${isEditing ? "ring-2 ring-[#005F8C]/20" : ""}`}>
      <CardHeader className="pb-2">
        <SectionHeader title="緊急連絡先" privacy="private" isEditingThis={isEditing} canEdit={canEdit} onEdit={onEdit} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emergency_contact" className="text-sm text-[#475569]">電話番号</Label>
              <Input id="emergency_contact" value={form.emergencyContact} onChange={(e) => onChange({ ...form, emergencyContact: e.target.value })} placeholder="090-0000-0000" className="border-[#dce3ea]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_name" className="text-sm text-[#475569]">氏名</Label>
                <Input id="emergency_contact_name" value={form.emergencyContactName} onChange={(e) => onChange({ ...form, emergencyContactName: e.target.value })} placeholder="山田花子" className="border-[#dce3ea]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_relation" className="text-sm text-[#475569]">続柄</Label>
                <Input id="emergency_contact_relation" value={form.emergencyContactRelation} onChange={(e) => onChange({ ...form, emergencyContactRelation: e.target.value })} placeholder="母・配偶者" className="border-[#dce3ea]" />
              </div>
            </div>
            <EditActions onCancel={onCancel} onSave={onSave} isPending={isPending} />
          </div>
        ) : (
          <div>
            <ProfileRow label="電話番号" value={form.emergencyContact || null} />
            <ProfileRow label="氏名" value={form.emergencyContactName || null} />
            <ProfileRow label="続柄" value={form.emergencyContactRelation || null} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
