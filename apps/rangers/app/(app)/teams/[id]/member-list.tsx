"use client"

import { useState } from "react"
import { removeMember } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"
import type { TeamMemberWithProfile } from "@/types/database"

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

interface MemberListProps {
  teamId: string
  members: TeamMemberWithProfile[]
}

export function MemberList({ teamId, members }: MemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleRemove = async (swimmerId: string) => {
    if (!confirm("このメンバーをチームから削除しますか？")) return
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
    <div className="space-y-3">
      {members.map((member) => {
        const swimmer = member.swimmer
        const tags = member.tags || []
        const isAdmin = member.role === "admin"
        const isPointCard = member.membership_type === "point_card"

        return (
          <Card key={member.id} className="border-[#dce3ea]">
            <CardContent className="flex items-center gap-3 p-4">
              {/* Avatar */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
                {swimmer?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={swimmer.avatar_url} alt={swimmer.name || ""} className="h-full w-full object-cover" />
                ) : (
                  swimmer?.name?.[0] || "?"
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-medium text-[#1a2332]">{swimmer?.name || "不明"}</p>
                  {isAdmin && (
                    <Badge className="border-transparent bg-[#e8f2f8] px-1.5 py-0 text-[10px] text-[#005F8C]">
                      管理者
                    </Badge>
                  )}
                  <Badge
                    className={
                      isPointCard
                        ? "border-transparent bg-[#fdf6e3] px-1.5 py-0 text-[10px] text-[#b8860b]"
                        : "border-transparent bg-[#eaf7f0] px-1.5 py-0 text-[10px] text-[#0f8a4f]"
                    }
                  >
                    {isPointCard ? "回数券" : "レギュラー"}
                  </Badge>
                </div>
                {!!swimmer?.furigana && (
                  <p className="mt-0.5 text-xs text-[#8d99a8]">{swimmer.furigana}</p>
                )}
                {/* チームタグ */}
                {tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#f2f7fa] px-2 py-0.5 text-[10px] text-[#5c6a7a]">
                        {TAG_LABELS[tag] || tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* プロフィール種目タグ */}
                {(swimmer?.specialties || []).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {swimmer!.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-[10px] text-[#005F8C]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {isPointCard && member.stamp_remaining !== undefined && (
                  <p className="mt-0.5 text-xs text-[#5c6a7a]">残り {member.stamp_remaining} 回</p>
                )}
                {/* スイマー詳細情報 */}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#8d99a8]">
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

              {/* Actions */}
              {!isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (swimmer?.id) handleRemove(swimmer.id) }}
                  disabled={!swimmer?.id || removingId === swimmer.id}
                  className="shrink-0 text-xs text-[#5c6a7a] hover:text-red-600"
                >
                  削除
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
