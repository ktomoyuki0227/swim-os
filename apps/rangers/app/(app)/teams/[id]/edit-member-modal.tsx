"use client"

import { useState, useEffect } from "react"
import { updateMemberInfo } from "@/actions/teams"
import { useToast } from "@/components/toast"
import type { TeamMemberWithProfile, MembershipType } from "@/types/database"

interface EditMemberModalProps {
  member: TeamMemberWithProfile
  teamId: string
  currentUserId: string
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
  onClose: () => void
  onSuccess: () => void
}

export function EditMemberModal({
  member,
  teamId,
  currentUserId,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const { showToast } = useToast()

  const membershipOptions = [
    hasAnnualFee ? { value: "annual" as MembershipType, label: "年会費" } : null,
    hasMonthlyFee ? { value: "monthly" as MembershipType, label: "月謝" } : null,
    hasPointCard ? { value: "point_card" as MembershipType, label: "回数券" } : null,
  ].filter(Boolean) as { value: MembershipType; label: string }[]

  const currentType = member.membership_type as MembershipType
  const initialType: MembershipType =
    membershipOptions.some((o) => o.value === currentType)
      ? currentType
      : (membershipOptions[0]?.value ?? "monthly")

  const [membershipType, setMembershipType] = useState<MembershipType>(initialType)
  const [stampRemaining, setStampRemaining] = useState(member.stamp_remaining ?? 0)
  const [role, setRole] = useState<"admin" | "member">(
    (member.role as "admin" | "member") ?? "member"
  )
  const [isSaving, setIsSaving] = useState(false)

  const isSelf = member.swimmer?.id === currentUserId

  // Escape キーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleStampInput = (value: string) => {
    const n = parseInt(value, 10)
    setStampRemaining(isNaN(n) ? 0 : Math.max(0, n))
  }

  const handleSubmit = async () => {
    if (!member.swimmer?.id) return
    setIsSaving(true)
    const result = await updateMemberInfo(teamId, member.swimmer.id, {
      membershipType,
      stampRemaining: membershipType === "point_card" ? stampRemaining : undefined,
      role,
    })
    setIsSaving(false)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("メンバー情報を更新しました", "success")
      onSuccess()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-t-2xl border border-[#dce3ea] bg-white shadow-xl sm:rounded-2xl">
        {/* ヘッダー */}
        <div className="flex items-start justify-between border-b border-[#dce3ea] px-5 py-4">
          <div>
            <p className="text-xs text-[#8d99a8]">メンバー情報の編集</p>
            <p className="mt-0.5 font-semibold text-[#1a2332]">
              {member.swimmer?.name || "不明"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#8d99a8] hover:bg-[#f2f7fa] hover:text-[#5c6a7a]"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* 会員種別 */}
          {membershipOptions.length > 0 && (
            <div>
              <p className="mb-2.5 text-sm font-medium text-[#1a2332]">会員種別</p>
              <div className="flex flex-wrap gap-2">
                {membershipOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMembershipType(opt.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      membershipType === opt.value
                        ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                        : "border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 回数券残数（会員種別が回数券のときのみ表示） */}
          {membershipType === "point_card" && (
            <div>
              <p className="mb-2.5 text-sm font-medium text-[#1a2332]">回数券残数</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStampRemaining((n) => Math.max(0, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] text-lg text-[#5c6a7a] transition-colors hover:border-[#005F8C] hover:text-[#005F8C]"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={stampRemaining}
                  onChange={(e) => handleStampInput(e.target.value)}
                  className="w-16 rounded-xl border border-[#dce3ea] px-2 py-1.5 text-center text-sm text-[#1a2332] focus:border-[#005F8C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setStampRemaining((n) => n + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] text-lg text-[#5c6a7a] transition-colors hover:border-[#005F8C] hover:text-[#005F8C]"
                >
                  ＋
                </button>
                <span className="text-sm text-[#5c6a7a]">回</span>
              </div>
            </div>
          )}

          {/* 役割 */}
          <div>
            <p className="mb-2.5 text-sm font-medium text-[#1a2332]">グループでの役割</p>
            {isSelf ? (
              <p className="text-xs text-[#8d99a8]">自分の役割は変更できません</p>
            ) : (
              <div className="flex gap-2">
                {(["member", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      role === r
                        ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                        : "border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]"
                    }`}
                  >
                    {r === "admin" ? "管理者" : "一般メンバー"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 border-t border-[#dce3ea] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-full border border-[#dce3ea] py-2.5 text-sm font-medium text-[#5c6a7a] transition-colors hover:border-[#005F8C] disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-full bg-[#005F8C] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004E73] disabled:opacity-50"
            style={{ minHeight: "44px" }}
          >
            {isSaving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>
    </div>
  )
}
