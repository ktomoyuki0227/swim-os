"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  getAnnualFeeMatrix,
  getMonthlyFeeMatrix,
  type MonthlyFeeMatrixRow,
} from "@/actions/fees"
import { getStampMembers } from "@/actions/stamps"
import { removeMember } from "@/actions/teams"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MemberDetailModal } from "@/app/(app)/teams/[id]/member-detail-modal"
import type { TeamMemberWithProfile } from "@/types/database"
import { FeeTypeSelect, type FeeFilterType } from "./fee-type-select"
import { FeeMatrixTable, type FeeMatrixGroup } from "./fee-matrix-table"
import { StampSection } from "./stamp-section"
import { StampDashboard } from "./stamp-dashboard"

interface StampMemberRow {
  team_member_id: string
  swimmer_id: string
  role: string
  stamp_remaining: number
  profile: Record<string, unknown> | null
  purchases: {
    id: string
    card_count: number
    stamp_count: number
    amount: number
    note: string | null
    purchased_at: string
    status: string
  }[]
}

interface FeesManagerProps {
  teamId: string
  currentUserId: string
  members: TeamMemberWithProfile[]
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
}

function rowHasUnpaid(row: MonthlyFeeMatrixRow): boolean {
  return row.months.some((m) => m.status === "unpaid" || m.status === "failed")
}

/** 年会費は12マスとも同一レコードの複製なので月0のみを、月謝は12マス全てを実データとして数える */
function statsFor(rows: MonthlyFeeMatrixRow[], countAllMonths: boolean) {
  let paid = 0
  let unpaid = 0
  let paidAmount = 0
  let totalAmount = 0
  for (const row of rows) {
    const cells = countAllMonths ? row.months : row.months.slice(0, 1)
    for (const cell of cells) {
      if (cell.status === "no_record") continue
      totalAmount += cell.amount ?? 0
      if (cell.status === "paid") {
        paid++
        paidAmount += cell.amount ?? 0
      } else {
        unpaid++
      }
    }
  }
  return { paid, unpaid, paidAmount, totalAmount }
}

/** 回数券の購入記録の支払い状況+残数0(要再購入)の会員数を集計する */
function stampStatsFor(rows: StampMemberRow[]) {
  let paid = 0
  let unpaid = 0
  let paidAmount = 0
  let totalAmount = 0
  let lowBalanceCount = 0
  for (const row of rows) {
    if (row.stamp_remaining <= 0) lowBalanceCount++
    for (const purchase of row.purchases) {
      totalAmount += purchase.amount
      if (purchase.status === "paid") {
        paid++
        paidAmount += purchase.amount
      } else {
        unpaid++
      }
    }
  }
  return { paid, unpaid, paidAmount, totalAmount, lowBalanceCount }
}

/**
 * 「メンバー/会費」ページのメイン画面。年会費・月謝は1〜12月マトリクスで統合表示し、
 * 回数券だけ別の一覧(進捗+履歴)にする。絞り込み行は種別/年度/未払いのみの3分割で、
 * 種別は選択肢が4つだけなので軽量なドロップダウン(FeeTypeSelect)、年度はその場で
 * 前後させるステッパーにしている。
 */
export function FeesManager({
  teamId,
  currentUserId,
  members,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  pointCardCount,
}: FeesManagerProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [filterType, setFilterType] = useState<FeeFilterType>(
    hasAnnualFee || hasMonthlyFee ? "all" : "stamp_card"
  )
  const [year, setYear] = useState(new Date().getFullYear())
  const [unpaidOnly, setUnpaidOnly] = useState(false)

  const [annualRows, setAnnualRows] = useState<MonthlyFeeMatrixRow[]>([])
  const [monthlyRows, setMonthlyRows] = useState<MonthlyFeeMatrixRow[]>([])
  const [stampMembers, setStampMembers] = useState<StampMemberRow[]>([])
  const [matricesLoaded, setMatricesLoaded] = useState(false)
  const [stampLoaded, setStampLoaded] = useState(false)

  const [detailSwimmerId, setDetailSwimmerId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // 年会費・月謝は年度に依存するため year が変わるたびに取得する。
  // 回数券は年度と無関係(都度購入・都度消費)なので、別effectで一度だけ取得し、
  // 年度切替では再取得しない(不要なクエリを避ける)
  const fetchMatrices = async (targetYear: number) => {
    const [annual, monthly] = await Promise.all([
      hasAnnualFee ? getAnnualFeeMatrix(teamId, targetYear) : Promise.resolve({ data: { year: targetYear, members: [] } }),
      hasMonthlyFee ? getMonthlyFeeMatrix(teamId, targetYear) : Promise.resolve({ data: { year: targetYear, members: [] } }),
    ])
    setAnnualRows(annual.data?.members ?? [])
    setMonthlyRows(monthly.data?.members ?? [])
    setMatricesLoaded(true)
  }

  const fetchStamp = async () => {
    const stamp = hasPointCard ? await getStampMembers(teamId) : { data: [] }
    setStampMembers((stamp.data ?? []) as StampMemberRow[])
    setStampLoaded(true)
  }

  useEffect(() => {
    startTransition(() => fetchMatrices(year))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  useEffect(() => {
    startTransition(() => fetchStamp())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = () => { fetchMatrices(year); fetchStamp() }

  const openMember = (swimmerId: string) => setDetailSwimmerId(swimmerId)
  const openDelete = (swimmerId: string, name: string) => setDeleteTarget({ id: swimmerId, name })

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
      refetch()
    }
  }

  const detailMember = detailSwimmerId
    ? members.find((m) => m.swimmer?.id === detailSwimmerId) ?? null
    : null

  const visibleAnnualRows = unpaidOnly ? annualRows.filter(rowHasUnpaid) : annualRows
  const visibleMonthlyRows = unpaidOnly ? monthlyRows.filter(rowHasUnpaid) : monthlyRows

  const groups: FeeMatrixGroup[] = []
  if ((filterType === "all" || filterType === "annual") && hasAnnualFee) {
    groups.push({ label: "年会費", rows: visibleAnnualRows, combineMonths: true })
  }
  if ((filterType === "all" || filterType === "monthly") && hasMonthlyFee) {
    groups.push({ label: "月謝", rows: visibleMonthlyRows })
  }

  const annualStats = hasAnnualFee && (filterType === "all" || filterType === "annual") ? statsFor(annualRows, false) : null
  const monthlyStats = hasMonthlyFee && (filterType === "all" || filterType === "monthly") ? statsFor(monthlyRows, true) : null
  const stats = {
    paid: (annualStats?.paid ?? 0) + (monthlyStats?.paid ?? 0),
    unpaid: (annualStats?.unpaid ?? 0) + (monthlyStats?.unpaid ?? 0),
    paidAmount: (annualStats?.paidAmount ?? 0) + (monthlyStats?.paidAmount ?? 0),
    totalAmount: (annualStats?.totalAmount ?? 0) + (monthlyStats?.totalAmount ?? 0),
  }

  const memberCount = filterType === "stamp_card"
    ? stampMembers.length
    : groups.reduce((sum, g) => sum + g.rows.length, 0)

  const showLoading = filterType === "stamp_card" ? !stampLoaded : !matricesLoaded && isPending

  // 回数券のお金回りダッシュボード: 「回数券」表示時は一覧の上に、「すべて」表示時は
  // 年会費・月謝の会員一覧テーブルの下に追記する(hasPointCardが無ければ両方とも出さない)
  const stampStats = hasPointCard ? stampStatsFor(stampMembers) : null

  return (
    <div className="space-y-4">
      {/* 絞り込み行: 種別 / 年度 / 未払いのみ の3分割 */}
      <div className="grid grid-cols-3 divide-x divide-[#dce3ea] rounded-2xl border border-[#dce3ea] bg-white">
        <FeeTypeSelect
          value={filterType}
          hasAnnualFee={hasAnnualFee}
          hasMonthlyFee={hasMonthlyFee}
          hasPointCard={hasPointCard}
          onChange={setFilterType}
        />

        {filterType === "stamp_card" ? (
          <div className="flex min-h-[46px] items-center justify-center text-sm text-[#c8d0d8]">ー</div>
        ) : (
          <div className="flex min-h-[46px] items-center justify-center gap-3 text-sm text-[#1a2332]">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#f2f7fa]"
              aria-label="前年"
            >
              ‹
            </button>
            <span>{year}年度</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#f2f7fa]"
              aria-label="翌年"
            >
              ›
            </button>
          </div>
        )}

        {filterType === "stamp_card" ? (
          <div className="flex min-h-[46px] items-center justify-center text-sm text-[#c8d0d8]">ー</div>
        ) : (
          <button
            type="button"
            onClick={() => setUnpaidOnly((v) => !v)}
            className="flex min-h-[46px] items-center justify-center gap-2 text-sm"
          >
            <span className={unpaidOnly ? "font-semibold text-[#005F8C]" : "text-[#475569]"}>未払いのみ</span>
            <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${unpaidOnly ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${unpaidOnly ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
        )}
      </div>

      {/* サマリー: 年会費・月謝の支払済み/未払い(回数券タブでは概念が合わないため非表示) */}
      {filterType !== "stamp_card" && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#dce3ea] bg-white p-3 text-center">
            <p className="text-xl font-bold text-[#0f8a4f]">{stats.paid}</p>
            <p className="text-xs text-[#475569]">支払済み</p>
          </div>
          <div className="rounded-2xl border border-[#dce3ea] bg-white p-3 text-center">
            <p className="text-xl font-bold text-[#b8860b]">{stats.unpaid}</p>
            <p className="text-xs text-[#475569]">未払い</p>
          </div>
          <div className="rounded-2xl border border-[#dce3ea] bg-white p-3 text-center">
            <p className="text-base font-bold text-[#005F8C]">¥{stats.paidAmount.toLocaleString()}</p>
            <p className="text-xs text-[#475569]">/ ¥{stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* 回数券ダッシュボード: 「回数券」表示時はここ(一覧の上)に出す */}
      {filterType === "stamp_card" && stampLoaded && stampStats && (
        <StampDashboard
          paidCount={stampStats.paid}
          unpaidCount={stampStats.unpaid}
          paidAmount={stampStats.paidAmount}
          totalAmount={stampStats.totalAmount}
          lowBalanceCount={stampStats.lowBalanceCount}
        />
      )}

      <h2 className="text-sm font-semibold text-[#1a2332]">会員一覧（{memberCount}名）</h2>

      {showLoading ? (
        <div className="rounded-xl border border-[#dce3ea] bg-white py-10 text-center text-sm text-[#475569]">
          読み込み中...
        </div>
      ) : filterType === "stamp_card" ? (
        <StampSection
          teamId={teamId}
          pointCardCount={pointCardCount}
          members={stampMembers}
          onOpenMember={openMember}
          onRemoveMember={openDelete}
          removingId={removingId}
          onChanged={refetch}
        />
      ) : (
        <FeeMatrixTable
          groups={groups}
          onOpenMember={openMember}
          onRemoveMember={openDelete}
          removingId={removingId}
          onChanged={refetch}
        />
      )}

      {/* 回数券ダッシュボード: 「すべて」表示時は年会費・月謝の一覧テーブルの下に追記する */}
      {filterType === "all" && stampLoaded && stampStats && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1a2332]">回数券会員（{stampMembers.length}名）</h2>
          <StampDashboard
            paidCount={stampStats.paid}
            unpaidCount={stampStats.unpaid}
            paidAmount={stampStats.paidAmount}
            totalAmount={stampStats.totalAmount}
            lowBalanceCount={stampStats.lowBalanceCount}
          />
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
          onClose={() => setDetailSwimmerId(null)}
          onSuccess={() => { setDetailSwimmerId(null); router.refresh(); refetch() }}
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
    </div>
  )
}
