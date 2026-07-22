"use client"

interface StampMember {
  team_member_id: string
  swimmer_id: string
  stamp_remaining: number
  profile: Record<string, unknown> | null
  purchases: {
    id: string
    card_count: number
    stamp_count: number
    amount: number
    note: string | null
    purchased_at: string
  }[]
}

interface Props {
  pointCardCount: number
  members: StampMember[]
}

export function StampSection({ pointCardCount, members }: Props) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-[#dce3ea] bg-white py-10 text-center text-sm text-[#475569]">
        回数券会員がいません
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {members.map((m) => {
        const name = (m.profile?.name as string) || "不明"
        const used = pointCardCount - m.stamp_remaining
        const pct = used <= 0 ? 0 : Math.round(((used - 1) / (pointCardCount - 1)) * 100)

        return (
          <div key={m.swimmer_id} className="rounded-xl border border-[#dce3ea] bg-white p-4 space-y-3">
            {/* ヘッダー */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
                {name[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1a2332]">{name}</p>
                <p className="text-sm text-[#475569]">
                  {m.purchases.length}枚購入済 · 残り {m.stamp_remaining} 回
                </p>
              </div>
              <span className="text-sm font-bold text-[#005F8C]">
                {used}<span className="text-sm font-normal text-[#64748b]"> / {pointCardCount}</span>
              </span>
            </div>

            {/* スタンプ進捗 */}
            <div className="relative py-1">
              {/* バー（ドットの中心間を繋ぐ） */}
              <div className="absolute top-1/2 left-[14px] right-[14px] h-2 -translate-y-1/2 overflow-hidden rounded-full bg-[#edf0f4]">
                <div
                  className="h-full rounded-full bg-[#005F8C] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {/* ドット */}
              <div className="relative flex justify-between">
                {Array.from({ length: pointCardCount }).map((_, i) => {
                  const isUsed = i < used
                  return (
                    <div
                      key={i}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-300 ${
                        isUsed
                          ? "border-[#005F8C] bg-[#005F8C] text-white"
                          : "border-[#dce3ea] bg-white text-[#64748b]"
                      }`}
                    >
                      {isUsed ? "✓" : i + 1}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
