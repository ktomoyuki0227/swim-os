"use client"

import { useEffect, useState, useTransition } from "react"
import { getMonthlyFeeMatrix, updateFeeStatus, type MonthlyFeeMatrixRow } from "@/actions/fees"
import { FeeStatusToggle } from "./fee-status-toggle"

interface MonthlyFeeMatrixProps {
  teamId: string
  initialYear: number
}

/**
 * 月謝会員の年間(1〜12月)支払い状況を一覧できるマトリクス。
 * 年会費・回数券は対象外(年1回・都度購入という性質上、12ヶ月マトリクスは意味が薄いため)。
 */
export function MonthlyFeeMatrix({ teamId, initialYear }: MonthlyFeeMatrixProps) {
  const [year, setYear] = useState(initialYear)
  const [members, setMembers] = useState<MonthlyFeeMatrixRow[] | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await getMonthlyFeeMatrix(teamId, year)
      setMembers(result.data?.members ?? [])
    })
  }, [teamId, year])

  // FeeStatusToggle は成功時に router.refresh() で Server Component 側の再取得を
  // 促すが、このマトリクスは自前でクライアント側フェッチしたデータを保持しているため
  // それだけでは反映されない。ここで明示的に再取得して表示を最新化する
  const refetch = async () => {
    const result = await getMonthlyFeeMatrix(teamId, year)
    setMembers(result.data?.members ?? [])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1a2332]">年間支払い状況</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] text-[#475569] transition-colors hover:bg-[#f2f7fa] disabled:opacity-50"
            aria-label="前年"
          >
            ‹
          </button>
          <span className="w-14 text-center text-sm font-medium text-[#1a2332]">{year}年</span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] text-[#475569] transition-colors hover:bg-[#f2f7fa] disabled:opacity-50"
            aria-label="翌年"
          >
            ›
          </button>
        </div>
      </div>

      {members === null ? (
        <div className="rounded-xl border border-[#dce3ea] bg-white py-10 text-center text-sm text-[#475569]">
          読み込み中...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-[#dce3ea] bg-white py-10 text-center text-sm text-[#475569]">
          月謝会員がいません
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#dce3ea] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e8edf2] bg-[#f8fafb]">
                <th className="sticky left-0 z-10 bg-[#f8fafb] px-3 py-2 text-left text-xs font-medium text-[#64748b]">
                  会員
                </th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-medium text-[#64748b]">
                    {i + 1}月
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.swimmerId} className="border-b border-[#f2f7fa] last:border-0">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-medium text-[#1a2332]">
                    {m.name}
                  </td>
                  {m.months.map((cell) => (
                    <td key={cell.month} className="px-2 py-2 text-center">
                      <FeeStatusToggle
                        status={cell.status}
                        disabled={!cell.feeId}
                        confirmDescription={`${m.name}さんの${year}年${cell.month}月分の支払いステータスを「未払い」に戻します。`}
                        onMarkPaid={async () => {
                          const result = await updateFeeStatus(cell.feeId as string, "paid", "cash")
                          if (!result?.error) await refetch()
                          return result
                        }}
                        onRevert={async () => {
                          const result = await updateFeeStatus(cell.feeId as string, "unpaid")
                          if (!result?.error) await refetch()
                          return result
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
