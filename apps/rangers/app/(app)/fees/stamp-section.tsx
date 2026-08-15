"use client"

import { useState } from "react"
import { MemberMenu } from "@/app/(app)/teams/[id]/member-menu"
import { StampPurchaseDialog } from "./stamp-purchase-dialog"
import { StampPurchaseStatus } from "./stamp-purchase-status"

interface StampPurchase {
  id: string
  card_count: number
  stamp_count: number
  amount: number
  note: string | null
  purchased_at: string
  status: string
}

interface StampMember {
  team_member_id: string
  swimmer_id: string
  role: string
  stamp_remaining: number
  profile: Record<string, unknown> | null
  purchases: StampPurchase[]
}

interface Props {
  teamId: string
  pointCardCount: number
  members: StampMember[]
  onOpenMember: (swimmerId: string) => void
  onRemoveMember: (swimmerId: string, name: string) => void
  removingId: string | null
  onChanged: () => void
}

/**
 * 回数券会員の一覧。年会費・月謝のカレンダーマトリクスとは性質が異なる
 * (都度購入・都度消費)ため、各行はミニ進捗バー+残数のみの圧縮表示にし、
 * 詳しい進捗・購入履歴・購入記録の追加は行右の「履歴」から開くシートに集約する。
 */
export function StampSection({ teamId, pointCardCount, members, onOpenMember, onRemoveMember, removingId, onChanged }: Props) {
  const [historySwimmerId, setHistorySwimmerId] = useState<string | null>(null)

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-[#dce3ea] bg-white py-10 text-center text-sm text-[#475569]">
        回数券会員がいません
      </div>
    )
  }

  const historyMember = members.find((m) => m.swimmer_id === historySwimmerId) ?? null

  return (
    <>
      <div className="space-y-1.5">
        {members.map((m) => {
          const name = (m.profile?.name as string) || "不明"
          // 残数分だけ緑に光らせる(逆に「消費数」を光らせてしまっていたバグを修正)
          const cappedRemaining = Math.min(Math.max(m.stamp_remaining, 0), pointCardCount)

          return (
            <div key={m.swimmer_id} className="flex items-center gap-2 rounded-xl border border-[#dce3ea] bg-white px-2.5 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C]">
                {name[0] || "?"}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#1a2332]">{name}</p>
              <div className="flex w-16 shrink-0 gap-[3px]">
                {Array.from({ length: pointCardCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-[5px] flex-1 rounded-full ${i < cappedRemaining ? "bg-[#0f8a4f]" : "bg-[#f2f7fa]"}`}
                  />
                ))}
              </div>
              <span className="shrink-0 text-xs text-[#64748b]">残{m.stamp_remaining}/{pointCardCount}</span>
              <MemberMenu
                swimmerId={m.swimmer_id}
                memberName={name}
                isAdmin={m.role === "admin"}
                isRemoving={removingId === m.swimmer_id}
                onOpen={onOpenMember}
                onRemove={onRemoveMember}
                extraActions={[{ label: "購入履歴・記録を追加", onClick: () => setHistorySwimmerId(m.swimmer_id) }]}
              />
            </div>
          )
        })}
      </div>

      {historyMember && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setHistorySwimmerId(null) }}
        >
          <div className="flex max-h-[85dvh] w-full max-w-sm flex-col rounded-t-2xl border border-[#dce3ea] bg-white shadow-xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[#dce3ea] px-5 py-4">
              <p className="font-semibold text-[#1a2332]">
                {(historyMember.profile?.name as string) || "不明"} の回数券履歴
              </p>
              <button
                onClick={() => setHistorySwimmerId(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f2f7fa] hover:text-[#475569]"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-sm text-[#475569]">
                残り <span className="font-semibold text-[#1a2332]">{historyMember.stamp_remaining}</span> / {pointCardCount}回
              </p>
              <p className="mb-2 text-xs font-medium text-[#64748b]">購入履歴</p>
              {historyMember.purchases.length === 0 ? (
                <p className="text-xs text-[#94a3b8]">購入記録がありません</p>
              ) : (
                <ul className="space-y-2">
                  {historyMember.purchases.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 text-xs text-[#475569]">
                      <div className="min-w-0 flex-1">
                        <span>
                          {new Date(p.purchased_at).toLocaleDateString("ja-JP")} ・{" "}
                          {p.card_count}枚 × {p.stamp_count}回
                          {p.note ? `（${p.note}）` : ""}
                        </span>
                        <span className="ml-2 font-medium text-[#1a2332]">
                          ¥{p.amount.toLocaleString()}
                        </span>
                      </div>
                      <StampPurchaseStatus
                        purchaseId={p.id}
                        status={p.status as "unpaid" | "paid" | "failed"}
                        swimmerName={(historyMember.profile?.name as string) || "不明"}
                        onChanged={onChanged}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 justify-end border-t border-[#dce3ea] px-5 py-4">
              <StampPurchaseDialog
                teamId={teamId}
                swimmerId={historyMember.swimmer_id}
                swimmerName={(historyMember.profile?.name as string) || "不明"}
                defaultStampCount={pointCardCount}
                onChanged={onChanged}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
