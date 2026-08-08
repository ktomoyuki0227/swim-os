"use client"

import { Card, CardContent } from "@/components/ui/card"
import { updateFeeStatus } from "@/actions/fees"
import { FeeStatusToggle } from "./fee-status-toggle"

interface FeeRow {
  id: string
  name: string
  amount: number
  paidAt: string | null
  status: "unpaid" | "paid" | "failed" | "no_record"
}

interface FeeListProps {
  fees: FeeRow[]
}

/**
 * 会員一覧＋支払いステータス変更UI。Server Component から plain data のみを受け取り、
 * updateFeeStatus はここで直接 import して呼び出す
 * (app/(app)/sessions/[id]/cash-collection.tsx の CashRow と同じ構成)。
 */
export function FeeList({ fees }: FeeListProps) {
  return (
    <div className="space-y-2">
      {fees.map((fee) => (
        <Card key={fee.id} className="border-[#dce3ea]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
              {fee.name[0] || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#1a2332]">{fee.name}</p>
              <p className="text-xs text-[#475569]">
                {fee.status === "no_record"
                  ? "会費レコード未作成"
                  : `¥${fee.amount.toLocaleString()}${fee.paidAt ? ` · ${new Date(fee.paidAt).toLocaleDateString("ja-JP")}支払済` : ""}`}
              </p>
            </div>
            <FeeStatusToggle
              status={fee.status}
              confirmDescription={`${fee.name}さんの支払いステータスを「未払い」に戻します。本当に元に戻しても大丈夫ですか？`}
              onMarkPaid={() => updateFeeStatus(fee.id, "paid", "cash")}
              onRevert={() => updateFeeStatus(fee.id, "unpaid")}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
