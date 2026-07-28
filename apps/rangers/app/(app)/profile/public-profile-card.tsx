"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { TARGET_AGES } from "@/types/database"
import { ProfileBlockRow, EditActions, PrivacyBadge, PencilButton, TagGroup, TagRow } from "./profile-ui"
import type { PublicForm } from "./profile-sections"

interface PublicProfileCardProps {
  isLoading: boolean
  isEditing: boolean
  canEdit: boolean
  isPending: boolean
  userId: string | null
  form: PublicForm
  onChange: (next: PublicForm) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function PublicProfileCard({
  isLoading,
  isEditing,
  canEdit,
  isPending,
  userId,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: PublicProfileCardProps) {
  return (
    <Card className={`border-[#dce3ea] transition-shadow ${isEditing ? "ring-2 ring-[#005F8C]/20" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base text-[#1a2332]">公開プロフィール</CardTitle>
            <p className="mt-0.5 text-xs text-[#64748b]">他のユーザーに公開されます</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PrivacyBadge type="public" />
            {canEdit && <PencilButton onClick={onEdit} />}
            {isEditing && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
          </div>
        </div>
        {!isEditing && userId && (
          <Link
            href={`/profiles/${userId}`}
            className="mt-2 inline-flex items-center gap-1 text-xs text-[#005F8C] hover:underline"
          >
            公開プレビューを見る
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-sm text-[#475569]">自己紹介</Label>
              <textarea id="bio" value={form.bio} onChange={(e) => onChange({ ...form, bio: e.target.value })} rows={3} placeholder="指導スタイルや強みを教えてください" className="w-full resize-none rounded-[10px] border border-[#dce3ea] bg-white px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="career" className="text-sm text-[#475569]">経歴</Label>
              <textarea id="career" value={form.career} onChange={(e) => onChange({ ...form, career: e.target.value })} rows={3} placeholder="例: ○○大学水泳部、指導歴10年" className="w-full resize-none rounded-[10px] border border-[#dce3ea] bg-white px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="achievements" className="text-sm text-[#475569]">実績</Label>
              <textarea id="achievements" value={form.achievements} onChange={(e) => onChange({ ...form, achievements: e.target.value })} rows={3} placeholder="例: 全日本マスターズ優勝、指導選手の入賞" className="w-full resize-none rounded-[10px] border border-[#dce3ea] bg-white px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30" />
            </div>
            <TagGroup label="指導対象年齢" items={TARGET_AGES} selected={form.targetAges} onChange={(targetAges) => onChange({ ...form, targetAges })} />
            <EditActions onCancel={onCancel} onSave={onSave} isPending={isPending} />
          </div>
        ) : (
          <div>
            <ProfileBlockRow label="自己紹介" value={form.bio || null} />
            <ProfileBlockRow label="経歴" value={form.career || null} />
            <ProfileBlockRow label="実績" value={form.achievements || null} />
            {form.targetAges.length > 0 && <TagRow label="指導対象年齢" items={form.targetAges} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
