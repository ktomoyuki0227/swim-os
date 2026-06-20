"use client"

import { useState, useRef, useEffect } from "react"
import { removeMember } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/toast"
import type { TeamMemberWithProfile, Team } from "@/types/database"

const TAG_LABELS: Record<string, string> = {
  level_beginner: "初級",
  level_intermediate: "中級",
  level_advanced: "上級",
  stroke_freestyle: "クロール",
  stroke_backstroke: "背泳ぎ",
  stroke_breaststroke: "平泳ぎ",
  stroke_butterfly: "バタフライ",
  stroke_medley: "個人メドレー",
  purpose_health: "健康・趣味",
  purpose_competitive: "競技",
}

function getMembershipLabel(member: TeamMemberWithProfile, team: Team): string {
  if (member.membership_type === "point_card") {
    return member.stamp_remaining !== undefined
      ? `回数券 · 残り${member.stamp_remaining}回`
      : "回数券"
  }
  if (team.has_monthly_fee) return "月謝"
  if (team.has_annual_fee) return "年会費"
  return "メンバー"
}

function MemberMenu({
  swimmerId,
  isRemoving,
  onRemove,
}: {
  swimmerId: string
  isRemoving: boolean
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isRemoving}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#8d99a8] transition-colors hover:bg-[#f2f7fa] hover:text-[#5c6a7a] disabled:opacity-50"
        aria-label="メニューを開く"
      >
        <span className="text-base leading-none tracking-tighter">•••</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-10 min-w-[120px] overflow-hidden rounded-xl border border-[#dce3ea] bg-white shadow-lg">
          <button
            onClick={() => {
              setOpen(false)
              onRemove(swimmerId)
            }}
            className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            削除
          </button>
        </div>
      )}
    </div>
  )
}

interface MemberListProps {
  teamId: string
  team: Team
  members: TeamMemberWithProfile[]
}

export function MemberList({ teamId, team, members }: MemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleRemove = async (swimmerId: string) => {
    if (!confirm("このメンバーをグループから削除しますか？")) return
    setRemovingId(swimmerId)
    const result = await removeMember(teamId, swimmerId)
    setRemovingId(null)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      window.location.reload()
    }
  }

  if (members.length === 0) {
    return (
      <Card className="border-[#dce3ea]">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-sm text-[#5c6a7a]">まだメンバーがいません</p>
          <p className="mt-1 text-xs text-[#8d99a8]">招待タブからリンクを共有してください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const swimmer = member.swimmer
        const tags = member.tags || []
        const isAdmin = member.role === "admin"
        const isPointCard = member.membership_type === "point_card"
        const isLowStamp = isPointCard && member.stamp_remaining !== undefined && member.stamp_remaining <= 3
        const membershipLabel = getMembershipLabel(member, team)

        const hasDetails =
          tags.length > 0 ||
          (swimmer?.specialties || []).length > 0 ||
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
                    <p className="text-xs text-[#8d99a8]">{swimmer.furigana}</p>
                  )}
                  <p className="text-[11px] text-[#8d99a8]">
                    参加 {new Date(member.joined_at).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* バッジ・メニュー（右寄せ） */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {isAdmin && (
                    <Badge className="border-transparent bg-[#e8f2f8] px-1.5 py-0 text-[10px] text-[#005F8C]">
                      管理者
                    </Badge>
                  )}
                  <Badge
                    className={
                      isLowStamp
                        ? "border-transparent bg-[#fef2f2] px-1.5 py-0 text-[10px] text-[#dc2626]"
                        : isPointCard
                          ? "border-transparent bg-[#fdf6e3] px-1.5 py-0 text-[10px] text-[#b8860b]"
                          : "border-transparent bg-[#eaf7f0] px-1.5 py-0 text-[10px] text-[#0f8a4f]"
                    }
                  >
                    {membershipLabel}
                  </Badge>
                  {!isAdmin && swimmer?.id && (
                    <MemberMenu
                      swimmerId={swimmer.id}
                      isRemoving={removingId === swimmer.id}
                      onRemove={handleRemove}
                    />
                  )}
                </div>
              </div>

              {/* 下段: タグ・詳細情報（全幅） */}
              {hasDetails && (
                <div className="mt-2 space-y-1">
                  {/* グループタグ */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-[#f2f7fa] px-2 py-0.5 text-[10px] text-[#5c6a7a]">
                          {TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 種目タグ */}
                  {(swimmer?.specialties || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {swimmer!.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-[10px] text-[#005F8C]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 個人情報 */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#8d99a8]">
                    {!!swimmer?.gender && (
                      <span>
                        {swimmer.gender === "male" ? "男性" : swimmer.gender === "female" ? "女性" : "その他"}
                      </span>
                    )}
                    {(swimmer?.prefectures || []).length > 0 && (
                      <span>
                        {(() => {
                          const prefs = swimmer!.prefectures
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
  )
}
