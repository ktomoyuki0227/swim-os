"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileRow, EditActions, SectionHeader } from "./profile-ui"
import type { BasicForm } from "./profile-sections"

interface BasicInfoCardProps {
  isLoading: boolean
  isEditing: boolean
  canEdit: boolean
  isPending: boolean
  email: string
  form: BasicForm
  onChange: (next: BasicForm) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function BasicInfoCard({
  isLoading,
  isEditing,
  canEdit,
  isPending,
  email,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: BasicInfoCardProps) {
  const genderLabel =
    form.gender === "male" ? "男性" : form.gender === "female" ? "女性" : form.gender === "other" ? "その他" : null
  const birthdayLabel = form.birthday ? form.birthday.replace(/-/g, "/") : null

  return (
    <Card className={`border-[#dce3ea] transition-shadow ${isEditing ? "ring-2 ring-[#005F8C]/20" : ""}`}>
      <CardHeader className="pb-2">
        <SectionHeader title="基本情報" privacy="private" isEditingThis={isEditing} canEdit={canEdit} onEdit={onEdit} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm text-[#475569]">名前 <span className="text-[#c0392b]">*</span></Label>
                <Input id="name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="border-[#dce3ea]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="furigana" className="text-sm text-[#475569]">フリガナ</Label>
                <Input id="furigana" value={form.furigana} onChange={(e) => onChange({ ...form, furigana: e.target.value })} placeholder="ヤマダ ケンタ" className="border-[#dce3ea]" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-sm text-[#475569]">性別</Label>
                <select id="gender" value={form.gender} onChange={(e) => onChange({ ...form, gender: e.target.value })} className="min-h-[48px] w-full rounded-[10px] border border-[#dce3ea] bg-white px-4 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30">
                  <option value="">選択</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthday" className="text-sm text-[#475569]">生年月日</Label>
                <Input id="birthday" type="date" value={form.birthday} onChange={(e) => onChange({ ...form, birthday: e.target.value })} className="border-[#dce3ea]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-[#475569]">メールアドレス</Label>
              <div className="flex min-h-[48px] items-center rounded-[10px] bg-[#f2f7fa] px-4 text-sm text-[#64748b]">
                {email}
              </div>
              <p className="text-xs text-[#64748b]">メールアドレスはアカウント設定から変更できます</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm text-[#475569]">電話番号</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} placeholder="09012345678" className="border-[#dce3ea]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm text-[#475569]">住所</Label>
              <Input id="address" value={form.address} onChange={(e) => onChange({ ...form, address: e.target.value })} placeholder="例: 東京都渋谷区..." className="border-[#dce3ea]" />
            </div>
            <EditActions onCancel={onCancel} onSave={onSave} isPending={isPending} />
          </div>
        ) : (
          <div>
            <ProfileRow label="名前" value={form.name || null} />
            <ProfileRow label="フリガナ" value={form.furigana || null} />
            <ProfileRow label="性別" value={genderLabel} />
            <ProfileRow label="生年月日" value={birthdayLabel} />
            <ProfileRow label="メールアドレス" value={email || null} />
            <ProfileRow label="電話番号" value={form.phone || null} />
            <ProfileRow label="住所" value={form.address || null} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
