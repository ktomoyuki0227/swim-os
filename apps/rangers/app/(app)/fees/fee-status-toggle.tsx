"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type FeeStatus = "unpaid" | "paid" | "failed" | "no_record"

interface FeeStatusToggleProps {
  status: FeeStatus
  /** true の場合、状態に関わらずクリック不可のバッジ表示のみにする（status="no_record" は常に非活性） */
  disabled?: boolean
  confirmTitle?: string
  confirmDescription?: string
  onMarkPaid: () => Promise<{ error?: string } | void>
  onRevert: () => Promise<{ error?: string } | void>
}

const STATUS_LABEL: Record<FeeStatus, string> = {
  paid: "支払済",
  unpaid: "未払い",
  failed: "決済失敗",
  no_record: "未登録",
}

const STATUS_BADGE_CLASS: Record<FeeStatus, string> = {
  paid: "bg-[#eaf7f0] text-[#0f8a4f]",
  unpaid: "bg-[#fdf6e3] text-[#b8860b]",
  failed: "bg-[#fdecea] text-[#c0392b]",
  no_record: "bg-[#edf0f4] text-[#475569]",
}

/**
 * 会費・回数券・都度参加費など、支払いステータスをクリックで直接変更できる共通コンポーネント。
 * app/(app)/sessions/[id]/cash-collection.tsx の CashRow と同じパターン
 * (useTransition + ConfirmDialog) を汎用化したもの。
 */
export function FeeStatusToggle({
  status,
  disabled = false,
  confirmTitle = "支払済みステータスを取り消しますか？",
  confirmDescription = "支払いステータスを「未払い」に戻します。本当に元に戻しても大丈夫ですか？",
  onMarkPaid,
  onRevert,
}: FeeStatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const isNonInteractive = disabled || status === "no_record"
  const isPaid = status === "paid"

  const run = (action: () => Promise<{ error?: string } | void>) => {
    startTransition(async () => {
      try {
        const result = await action()
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

  if (isNonInteractive) {
    return (
      <Badge className={`border-transparent ${STATUS_BADGE_CLASS[status]}`}>
        {STATUS_LABEL[status]}
      </Badge>
    )
  }

  if (isPaid) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowUndoConfirm(true)}
          disabled={isPending}
          className="rounded-full disabled:opacity-50"
          aria-label="支払済みを取り消す"
        >
          <Badge className={`border-transparent transition-colors hover:bg-[#d5efe0] ${STATUS_BADGE_CLASS.paid}`}>
            {isPending ? "処理中..." : STATUS_LABEL.paid}
          </Badge>
        </button>
        <ConfirmDialog
          open={showUndoConfirm}
          title={confirmTitle}
          description={confirmDescription}
          confirmLabel="元に戻す"
          cancelLabel="キャンセル"
          variant="danger"
          isLoading={isPending}
          loadingLabel="処理中..."
          onConfirm={() => { setShowUndoConfirm(false); run(onRevert) }}
          onCancel={() => setShowUndoConfirm(false)}
        />
      </>
    )
  }

  return (
    <button
      type="button"
      onClick={() => run(onMarkPaid)}
      disabled={isPending}
      className="rounded-full disabled:opacity-50"
      aria-label="現金受領済みにする"
    >
      <Badge className={`border-transparent transition-colors hover:opacity-80 ${STATUS_BADGE_CLASS[status]}`}>
        {isPending ? "処理中..." : "現金受領済みにする"}
      </Badge>
    </button>
  )
}
