"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SWIM_SPECIALTIES, SWIMMING_GOALS, PARTICIPATION_STYLES, SWIM_LEVELS, SWIMMER_TYPES, SWIM_DISCIPLINES } from "@/types/database"
import { EditActions, SectionHeader, TagGroup, TagRow, PrefectureMultiSelect } from "./profile-ui"
import type { SwimmerForm } from "./profile-sections"

interface SwimmerInfoCardProps {
  isLoading: boolean
  isEditing: boolean
  canEdit: boolean
  isPending: boolean
  form: SwimmerForm
  onChange: (next: SwimmerForm) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function SwimmerInfoCard({
  isLoading,
  isEditing,
  canEdit,
  isPending,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: SwimmerInfoCardProps) {
  return (
    <Card className={`border-[#dce3ea] transition-shadow ${isEditing ? "ring-2 ring-[#005F8C]/20" : ""}`}>
      <CardHeader className="pb-2">
        <SectionHeader title="スイマー情報" privacy="public" isEditingThis={isEditing} canEdit={canEdit} onEdit={onEdit} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isEditing ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-[#475569]">レベル</Label>
              <div className="flex gap-2">
                {SWIM_LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => onChange({ ...form, level: form.level === lv ? "" : lv })}
                    className={`flex-1 rounded-full border py-2 text-sm transition-colors ${form.level === lv ? "border-transparent bg-[#005F8C] text-white" : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"}`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>
            <PrefectureMultiSelect selected={form.prefectures} onChange={(prefectures) => onChange({ ...form, prefectures })} />
            <TagGroup
              label="種目・泳法"
              items={SWIM_SPECIALTIES}
              selected={form.specialties}
              onChange={(specialties) => onChange({ ...form, specialties })}
            />
            <TagGroup
              label="活動目的"
              items={SWIMMING_GOALS}
              selected={form.swimmingGoals}
              onChange={(swimmingGoals) => onChange({ ...form, swimmingGoals })}
            />
            <TagGroup
              label="参加スタイル"
              items={PARTICIPATION_STYLES}
              selected={form.participationStyles}
              onChange={(participationStyles) => onChange({ ...form, participationStyles })}
            />
            <div className="space-y-2">
              <Label className="text-sm text-[#475569]">スイマータイプ</Label>
              <div className="flex gap-2">
                {SWIMMER_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ ...form, swimmerType: form.swimmerType === t ? "" : t })}
                    className={`flex-1 rounded-full border py-2 text-sm transition-colors ${form.swimmerType === t ? "border-transparent bg-[#005F8C] text-white" : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <TagGroup
              label="水泳カテゴリ"
              items={SWIM_DISCIPLINES}
              selected={form.swimDisciplines}
              onChange={(swimDisciplines) => onChange({ ...form, swimDisciplines })}
            />
            <EditActions onCancel={onCancel} onSave={onSave} isPending={isPending} />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="border-b border-[#f2f7fa] py-3">
              <span className="mb-1.5 block text-xs text-[#64748b]">レベル</span>
              {form.level ? (
                <span className="rounded-full bg-[#f2f7fa] px-[10px] py-[3px] text-xs text-[#475569]">{form.level}</span>
              ) : (
                <span className="text-sm text-[#64748b]">未設定</span>
              )}
            </div>
            <TagRow label="活動地域" items={form.prefectures} maxVisible={5} />
            <TagRow label="種目・泳法" items={form.specialties} />
            <TagRow label="活動目的" items={form.swimmingGoals} />
            <TagRow label="参加スタイル" items={form.participationStyles} />
            <div className="border-b border-[#f2f7fa] py-3">
              <span className="mb-1.5 block text-xs text-[#64748b]">スイマータイプ</span>
              {form.swimmerType ? (
                <span className="rounded-full bg-[#f2f7fa] px-[10px] py-[3px] text-xs text-[#475569]">{form.swimmerType}</span>
              ) : (
                <span className="text-sm text-[#64748b]">未設定</span>
              )}
            </div>
            <TagRow label="水泳カテゴリ" items={form.swimDisciplines} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
