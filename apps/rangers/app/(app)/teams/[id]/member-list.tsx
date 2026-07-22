"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { removeMember } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/toast"
import { MemberDetailModal } from "./member-detail-modal"
import type { TeamMemberWithProfile } from "@/types/database"


const LEVEL_STARS: Record<string, string> = {
  "上級": "★★★",
  "中級": "★★☆",
  "初級": "★☆☆",
}

function getMembershipLabel(member: TeamMemberWithProfile): string {
  if (member.membership_type === "point_card") {
    return member.stamp_remaining !== undefined
      ? `回数券（残${member.stamp_remaining}）`
      : "回数券"
  }
  if (member.membership_type === "annual") return "年会費"
  if (member.membership_type === "monthly") return "月謝"
  return "メンバー"
}

function MemberMenu({
  swimmerId,
  memberName,
  isAdmin,
  isRemoving,
  onOpen,
  onRemove,
}: {
  swimmerId: string
  memberName: string
  isAdmin: boolean
  isRemoving: boolean
  onOpen: (id: string) => void
  onRemove: (id: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleScroll() {
      setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("scroll", handleScroll, true)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("scroll", handleScroll, true)
    }
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={isRemoving}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#f2f7fa] hover:text-[#475569] disabled:opacity-50"
        aria-label="メニューを開く"
      >
        <span className="text-base leading-none tracking-tighter">•••</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[140px] overflow-hidden rounded-xl border border-[#dce3ea] bg-white shadow-lg"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button
            onClick={() => {
              setOpen(false)
              onOpen(swimmerId)
            }}
            className="flex w-full items-center px-4 py-2.5 text-sm text-[#1a2332] transition-colors hover:bg-[#f2f7fa]"
          >
            詳細・編集
          </button>
          {!isAdmin && (
            <button
              onClick={() => {
                setOpen(false)
                onRemove(swimmerId, memberName)
              }}
              className="flex w-full items-center px-4 py-2.5 text-sm text-[#c0392b] transition-colors hover:bg-[#fdecea]"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DeleteConfirmModal({
  memberName,
  isRemoving,
  onConfirm,
  onCancel,
}: {
  memberName: string
  isRemoving: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-t-2xl border border-[#dce3ea] bg-white shadow-xl sm:rounded-2xl">
        <div className="px-5 py-5">
          <p className="font-semibold text-[#1a2332]">メンバーを削除しますか？</p>
          <p className="mt-1.5 text-sm text-[#475569]">
            <span className="font-medium text-[#1a2332]">{memberName}</span> をグループから削除します。この操作は取り消せません。
          </p>
        </div>
        <div className="flex gap-2 border-t border-[#dce3ea] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isRemoving}
            className="flex-1 rounded-full border border-[#dce3ea] py-2.5 text-sm font-medium text-[#475569] transition-colors hover:border-[#005F8C] disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex-1 rounded-full bg-[#c0392b] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#a93226] disabled:opacity-50"
            style={{ minHeight: "44px" }}
          >
            {isRemoving ? "削除中..." : "削除する"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface MemberListProps {
  teamId: string
  members: TeamMemberWithProfile[]
  currentUserId: string
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
}

export function MemberList({
  teamId,
  members,
  currentUserId,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  pointCardCount,
}: MemberListProps) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [detailMember, setDetailMember] = useState<TeamMemberWithProfile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { showToast } = useToast()

  const openMember = (swimmerId: string) => {
    const found = members.find((m) => m.swimmer?.id === swimmerId) ?? null
    setDetailMember(found)
  }

  const openDelete = (swimmerId: string, name: string) => {
    setDeleteTarget({ id: swimmerId, name })
  }

  const handleConfirmRemove = async () => {
    if (!deleteTarget) return
    setRemovingId(deleteTarget.id)
    const result = await removeMember(teamId, deleteTarget.id)
    setRemovingId(null)
    setDeleteTarget(null)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      router.refresh()
    }
  }

  if (members.length === 0) {
    return (
      <Card className="border-[#dce3ea]">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-sm text-[#475569]">まだメンバーがいません</p>
          <p className="mt-1 text-sm text-[#64748b]">招待タブからリンクを共有してください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <div className="space-y-2">
      {members.map((member) => {
        const swimmer = member.swimmer
        const isAdmin = member.role === "admin"
        const isPointCard = member.membership_type === "point_card"
        const isLowStamp = isPointCard && member.stamp_remaining !== undefined && member.stamp_remaining <= 3
        const membershipLabel = getMembershipLabel(member)

        const levelStars = swimmer?.level ? LEVEL_STARS[swimmer.level] ?? null : null

        const hasDetails =
          !!swimmer?.level ||
          (swimmer?.specialties || []).length > 0 ||
          (swimmer?.swimming_goals || []).length > 0 ||
          !!swimmer?.swimmer_type ||
          (swimmer?.swim_disciplines || []).length > 0 ||
          !!swimmer?.gender ||
          (swimmer?.prefectures || []).length > 0 ||
          !!swimmer?.address ||
          !!swimmer?.masters_registered ||
          !!swimmer?.jsa_registered

        return (
          <Card key={member.id} className="border-[#dce3ea]">
            <CardContent className="px-4 py-0">
              {/* 上段: アイコン・名前・フリガナ → バッジ・メニュー（1行） */}
              <div className="flex items-center gap-3">
                {/* アバター */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
                  {swimmer?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={swimmer.avatar_url} alt={swimmer.name || ""} className="h-full w-full object-cover" />
                  ) : (
                    swimmer?.name?.[0] || "?"
                  )}
                </div>

                {/* 名前・フリガナ・参加日 */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1a2332]">{swimmer?.name || "不明"}</p>
                  {!!swimmer?.furigana && (
                    <p className="text-sm text-[#64748b]">{swimmer.furigana}</p>
                  )}
                  <p className="text-sm text-[#64748b]">
                    参加 {new Date(member.joined_at).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* バッジ・メニュー（右寄せ） */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {isAdmin && (
                    <Badge className="border-transparent bg-[#e8f2f8] px-1.5 py-0 text-sm text-[#005F8C]">
                      管理者
                    </Badge>
                  )}
                  <Badge
                    className={
                      isLowStamp
                        ? "border-transparent bg-[#fdecea] px-1.5 py-0 text-sm text-[#c0392b]"
                        : isPointCard
                          ? "border-transparent bg-[#fdf6e3] px-1.5 py-0 text-sm text-[#b8860b]"
                          : "border-transparent bg-[#eaf7f0] px-1.5 py-0 text-sm text-[#0f8a4f]"
                    }
                  >
                    {membershipLabel}
                  </Badge>
                  {swimmer?.id && (
                    <MemberMenu
                      swimmerId={swimmer.id}
                      memberName={swimmer.name || "不明"}
                      isAdmin={isAdmin}
                      isRemoving={removingId === swimmer.id}
                      onOpen={openMember}
                      onRemove={openDelete}
                    />
                  )}
                </div>
              </div>

              {/* 下段: タグ・詳細情報（全幅） */}
              {hasDetails && (
                <div className="mt-2 space-y-1">
                  {/* 種目・目的・スイマータイプ・水泳カテゴリタグ */}
                  {(levelStars || (swimmer?.specialties ?? []).length > 0 || (swimmer?.swimming_goals ?? []).length > 0 || !!swimmer?.swimmer_type || (swimmer?.swim_disciplines ?? []).length > 0) && (
                    <div className="flex flex-wrap items-center gap-1">
                      {levelStars && swimmer?.level && (
                        <span className="mr-1 text-sm font-medium text-[#64748b]">{levelStars} {swimmer.level}</span>
                      )}
                      {swimmer?.specialties?.map((s) => (
                        <span key={s} className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-sm text-[#005F8C]">
                          {s}
                        </span>
                      ))}
                      {swimmer?.swimming_goals?.map((g) => (
                        <span key={g} className="rounded-full bg-[#eaf7f0] px-2 py-0.5 text-sm text-[#0f8a4f]">
                          {g}
                        </span>
                      ))}
                      {swimmer?.swimmer_type && (
                        <span className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-sm text-[#005F8C]">
                          {swimmer.swimmer_type}
                        </span>
                      )}
                      {swimmer?.swim_disciplines?.map((d) => (
                        <span key={d} className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-sm text-[#005F8C]">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 個人情報 */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-[#64748b]">
                    {!!swimmer?.gender && (
                      <span>
                        {swimmer.gender === "male" ? "男性" : swimmer.gender === "female" ? "女性" : "その他"}
                      </span>
                    )}
                    {(swimmer?.prefectures ?? []).length > 0 && (
                      <span>
                        {(() => {
                          const prefs = swimmer?.prefectures ?? []
                          const shown = prefs.slice(0, 2).join("・")
                          const rest = prefs.length - 2
                          return rest > 0 ? `${shown} +${rest}` : shown
                        })()}
                      </span>
                    )}
                    {!!swimmer?.address && <span>{swimmer.address}</span>}
                    {!!swimmer?.masters_registered && (
                      <span>マスターズ登録済{swimmer.masters_number ? `（${swimmer.masters_number}）` : ""}</span>
                    )}
                    {!!swimmer?.jsa_registered && (
                      <span>JSA登録済{swimmer.jsa_number ? `（${swimmer.jsa_number}）` : ""}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>

    {detailMember && (
      <MemberDetailModal
        member={detailMember}
        teamId={teamId}
        currentUserId={currentUserId}
        hasAnnualFee={hasAnnualFee}
        hasMonthlyFee={hasMonthlyFee}
        hasPointCard={hasPointCard}
        pointCardCount={pointCardCount}
        onClose={() => setDetailMember(null)}
        onSuccess={() => { setDetailMember(null); router.refresh() }}
      />
    )}

    {deleteTarget && (
      <DeleteConfirmModal
        memberName={deleteTarget.name}
        isRemoving={removingId === deleteTarget.id}
        onConfirm={handleConfirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    )}
    </>
  )
}
