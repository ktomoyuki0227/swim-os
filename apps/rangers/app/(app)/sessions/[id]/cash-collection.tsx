"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { markCashPaid, unmarkCashPaid } from "@/actions/sessions"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface CashRegistration {
  id: string
  swimmerName: string
  paymentStatus: string
}

interface CashCollectionPanelProps {
  registrations: CashRegistration[]
}

export function CashCollectionPanel({ registrations }: CashCollectionPanelProps) {
  const pendingCount = registrations.filter((r) => r.paymentStatus === "pending").length
  const paidCount = registrations.filter((r) => r.paymentStatus === "paid").length

  return (
    <div className="rounded-xl border border-[#005F8C]/20 bg-[#f2f7fa] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#005F8C]">集金管理</p>
        <div className="flex items-center gap-2 text-xs text-[#475569]">
          <span>
            <span className="font-semibold text-[#0f8a4f]">{paidCount}名</span> 集金済み
          </span>
          <span>·</span>
          <span>
            <span className="font-semibold text-[#b8860b]">{pendingCount}名</span> 未集金
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {registrations.map((reg) => (
          <CashRow key={reg.id} reg={reg} />
        ))}
      </div>
    </div>
  )
}

function CashRow({ reg }: { reg: CashRegistration }) {
  const [isPending, startTransition] = useTransition()
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const isCollected = reg.paymentStatus === "paid"
  const isFree = reg.paymentStatus === "free"

  const handleMarkPaid = () => {
    startTransition(async () => {
      try {
        const result = await markCashPaid(reg.id)
        if (result?.error) {
          showToast(result.error, "error")
        } else {
          router.refresh()
        }
      } catch {
        showToast("処理に失敗しました。もう一度お試しください。", "error")
      }
    })
  }

  const handleUndoPaid = () => {
    setShowUndoConfirm(false)
    startTransition(async () => {
      try {
        const result = await unmarkCashPaid(reg.id)
        if (result?.error) {
          showToast(result.error, "error")
        } else {
          router.refresh()
        }
      } catch {
        showToast("処理に失敗しました。もう一度お試しください。", "error")
      }
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C]">
        {reg.swimmerName[0]}
      </div>
      <p className="flex-1 text-sm font-medium text-[#1a2332]">{reg.swimmerName}</p>
      {isFree ? (
        <Badge className="bg-[#edf0f4] text-[#475569] border-transparent text-xs">免除</Badge>
      ) : isCollected ? (
        <button
          onClick={() => setShowUndoConfirm(true)}
          disabled={isPending}
          className="rounded-full disabled:opacity-50"
          aria-label="集金済みを取り消す"
        >
          <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-xs hover:bg-[#d5efe0] transition-colors">
            {isPending ? "処理中..." : "集金済み"}
          </Badge>
        </button>
      ) : (
        <button
          onClick={handleMarkPaid}
          disabled={isPending}
          className="rounded-lg bg-[#005F8C] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 hover:bg-[#004E73] transition-colors"
        >
          {isPending ? "処理中..." : "集金済みにする"}
        </button>
      )}

      <ConfirmDialog
        open={showUndoConfirm}
        title="集金済みステータスを取り消しますか？"
        description={`${reg.swimmerName}さんの支払いステータスを「未回収」に戻します。本当に元に戻しても大丈夫ですか？`}
        confirmLabel="元に戻す"
        cancelLabel="キャンセル"
        variant="danger"
        isLoading={isPending}
        loadingLabel="処理中..."
        onConfirm={handleUndoPaid}
        onCancel={() => setShowUndoConfirm(false)}
      />
    </div>
  )
}
