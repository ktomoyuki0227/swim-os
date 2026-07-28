"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { removeMember } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MemberDetailModal } from "./member-detail-modal"
import type { TeamMemberWithProfile } from "@/types/database"


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

interface MemberListProps {
  teamId: string
  members: TeamMemberWithProfile[]
  currentUserId: string
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
  /** 今期(年会費=今年/月謝=今月/回数券)の支払いが未確認のメンバーID */
  unpaidSwimmerIds: string[]
}

function unpaidToggleClass(isActive: boolean): string {
  return `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
    isActive ? "bg-[#005F8C] text-white" : "text-[#475569] hover:bg-[#f2f7fa]"
  }`
}

export function MemberList({
  teamId,
  members,
  currentUserId,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  pointCardCount,
  unpaidSwimmerIds,
}: MemberListProps) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [detailMember, setDetailMember] = useState<TeamMemberWithProfile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [unpaidOnly, setUnpaidOnly] = useState(false)
  const { showToast } = useToast()

  const unpaidSet = new Set(unpaidSwimmerIds)
  const visibleMembers = unpaidOnly
    ? members.filter((m) => !!m.swimmer?.id && unpaidSet.has(m.swimmer.id))
    : members

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
          <p className="mt-1 text-xs text-[#64748b]">招待タブからリンクを共有してください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    {/* 未払いのみ表示トグル */}
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs text-[#64748b]">{visibleMembers.length}人を表示</p>
      <div className="inline-flex rounded-full border border-[#dce3ea] bg-white p-0.5">
        <button type="button" onClick={() => setUnpaidOnly(false)} className={unpaidToggleClass(!unpaidOnly)}>
          すべて
        </button>
        <button type="button" onClick={() => setUnpaidOnly(true)} className={unpaidToggleClass(unpaidOnly)}>
          未払いのみ
        </button>
      </div>
    </div>

    {visibleMembers.length === 0 ? (
      <Card className="border-[#dce3ea]">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-sm text-[#475569]">未払いのメンバーはいません</p>
        </CardContent>
      </Card>
    ) : (
    <div className="space-y-2">
      {visibleMembers.map((member) => {
        const swimmer = member.swimmer
        const isAdmin = member.role === "admin"
        const membershipLabel = getMembershipLabel(member)
        const roleLabel = isAdmin ? "管理者" : "メンバー"
        const hasFeeObligation =
          !isAdmin &&
          (member.membership_type === "annual" ||
            member.membership_type === "monthly" ||
            member.membership_type === "point_card")
        const isUnpaid = hasFeeObligation && !!swimmer?.id && unpaidSet.has(swimmer.id)

        return (
          <Card key={member.id} className="border-[#dce3ea]">
            <CardContent className="flex items-center gap-3 px-3 py-2">
              {/* アバター */}
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C]">
                {swimmer?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={swimmer.avatar_url} alt={swimmer.name || ""} className="h-full w-full object-cover" />
                ) : (
                  swimmer?.name?.[0] || "?"
                )}
              </div>

              {/* 名前(ふりがな) / ロール・会費種別 */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1a2332]">
                  {swimmer?.name || "不明"}
                  {!!swimmer?.furigana && (
                    <span className="ml-1 text-xs font-normal text-[#64748b]">（{swimmer.furigana}）</span>
                  )}
                </p>
                <p className="truncate text-xs text-[#64748b]">
                  {roleLabel} ・ {membershipLabel}
                </p>
              </div>

              {/* 今月の支払い状況（全カード共通の固定幅・固定位置） */}
              <div className="flex w-[90px] shrink-0 justify-end">
                {hasFeeObligation ? (
                  isUnpaid ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#fdf6e3] px-2 py-1 text-xs font-semibold text-[#b8860b]">
                      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      未払い
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-[#eaf7f0] px-2 py-1 text-xs font-semibold text-[#0f8a4f]">
                      <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      支払済み
                    </span>
                  )
                ) : (
                  <span className="text-xs text-[#c8d0d8]">ー</span>
                )}
              </div>

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
            </CardContent>
          </Card>
        )
      })}
    </div>
    )}

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
      <ConfirmDialog
        open={!!deleteTarget}
        title="メンバーを削除しますか？"
        description={`${deleteTarget.name} をグループから削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        variant="danger"
        isLoading={removingId === deleteTarget.id}
        loadingLabel="削除中..."
        onConfirm={handleConfirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    )}
    </>
  )
}
