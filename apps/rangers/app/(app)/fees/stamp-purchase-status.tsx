"use client"

import { updateStampPurchaseStatus } from "@/actions/stamps"
import { FeeStatusToggle } from "./fee-status-toggle"

interface StampPurchaseStatusProps {
  purchaseId: string
  status: "unpaid" | "paid" | "failed"
  swimmerName: string
}

/**
 * 回数券購入記録の支払いステータス訂正用トグル。stamp_remaining は登録時に
 * 即時加算済みのため、これは入力ミスの訂正用途(actions/stamps.ts の
 * updateStampPurchaseStatus 参照)。
 */
export function StampPurchaseStatus({ purchaseId, status, swimmerName }: StampPurchaseStatusProps) {
  return (
    <FeeStatusToggle
      status={status}
      confirmDescription={`${swimmerName}さんの回数券購入の支払いステータスを「未払い」に戻します。`}
      onMarkPaid={() => updateStampPurchaseStatus(purchaseId, "paid", "cash")}
      onRevert={() => updateStampPurchaseStatus(purchaseId, "unpaid")}
    />
  )
}
