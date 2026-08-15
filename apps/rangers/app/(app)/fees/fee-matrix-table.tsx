"use client"

import { Fragment } from "react"
import { updateFeeStatus, type MonthlyFeeMatrixRow } from "@/actions/fees"
import { FeeStatusToggle } from "./fee-status-toggle"
import { MemberMenu } from "@/app/(app)/teams/[id]/member-menu"

export interface FeeMatrixGroup {
  /** "年会費" | "月謝" */
  label: string
  rows: MonthlyFeeMatrixRow[]
  /**
   * true: 12マスを1つに結合し、バッジ1つで年間分をまとめて表示する(年会費用)。
   * 12マスとも同一レコードの複製のため、まとめて見せた方が「年会費の人」だと
   * 一目で分かる。false: 月ごとに12個の独立したチェックアイコンを表示する(月謝用)。
   */
  combineMonths?: boolean
}

interface FeeMatrixTableProps {
  groups: FeeMatrixGroup[]
  onOpenMember: (swimmerId: string) => void
  onRemoveMember: (swimmerId: string, name: string) => void
  removingId: string | null
  onChanged: () => void
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

/**
 * 年会費・月謝の会員を1〜12月マス目で表示する一覧テーブル。
 * 年会費は年1回の支払いで12ヶ月分をまとめて扱うため、行内の12マスは同じ
 * feeId を共有しており(actions/fees.ts の getAnnualFeeMatrix 参照)、
 * どのマスをクリックしても連動して切り替わる。月謝は月ごとに独立したレコード。
 */
export function FeeMatrixTable({ groups, onOpenMember, onRemoveMember, removingId, onChanged }: FeeMatrixTableProps) {
  const nonEmptyGroups = groups.filter((g) => g.rows.length > 0)

  if (nonEmptyGroups.length === 0) {
    return (
      <div className="rounded-xl border border-[#dce3ea] bg-white py-10 text-center text-sm text-[#475569]">
        該当する会員がいません
      </div>
    )
  }

  return (
    // max-h + overflow-y-auto でこの div 自体を縦スクロールコンテナにする(会員数が
    // 増えてもページ全体が間延びしない上、theadのsticky top-0がこのdivを基準に効くため、
    // 外側レイアウト(ヘッダーの高さ等)に依存せず安定して月名ヘッダーを追従表示できる)
    <div className="max-h-[60vh] overflow-x-auto overflow-y-auto rounded-xl border border-[#dce3ea] bg-white">
      <table className="w-full min-w-[480px] border-collapse text-xs">
        <thead>
          {/* h-8 で高さを固定値(32px)にし、下のグループ見出し行の sticky top をこれと
              同じ値に合わせる(フォントの行送り任せだと1px単位でズレて隙間ができるため) */}
          <tr className="h-8 border-b border-[#e8edf2] bg-[#f8fafb]">
            <th className="sticky left-0 top-0 z-20 h-8 whitespace-nowrap bg-[#f8fafb] px-2 py-1.5 text-left font-medium text-[#64748b]">
              会員
            </th>
            {MONTH_LABELS.map((label) => (
              <th key={label} className="sticky top-0 z-10 h-8 bg-[#f8fafb] px-1 py-1.5 text-center font-medium text-[#64748b]">
                {label}
              </th>
            ))}
            <th className="sticky right-0 top-0 z-10 h-8 bg-[#f8fafb]" />
          </tr>
        </thead>
        <tbody>
          {nonEmptyGroups.map((group) => (
            <Fragment key={group.label}>
              <tr className="bg-[#fafbfc]">
                {/* 会員名列と同じく横スクロールでも流れないよう左に固定し、さらに
                    上のヘッダー行(h-8=32px)の直下に張り付くよう top-8 で縦方向にも
                    固定する。これによりグループの先頭行が常に画面内に見え続ける
                    (いわゆる sticky セクションヘッダー: 次のグループの見出しが
                    追いつくと自動的に前のものと入れ替わる) */}
                <td colSpan={14} className="sticky left-0 top-8 z-10 bg-[#fafbfc] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                  {group.label}（{group.rows.length}名）
                </td>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.swimmerId} className="border-b border-[#f2f7fa] last:border-0">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 font-medium text-[#1a2332]">
                    {row.name}
                  </td>
                  {group.combineMonths ? (
                    // 年会費: 12マスとも同一レコードの複製なので、1つのバッジに結合して
                    // 「年間分をまとめて支払う年会費の人」であることを一目で分かるようにする
                    <td colSpan={12} className="px-2 py-1 text-center">
                      <FeeStatusToggle
                        status={row.months[0].status}
                        disabled={!row.months[0].feeId}
                        confirmDescription={`${row.name}さんの支払いステータスを「未払い」に戻します。`}
                        successLabel={`${row.name}さんの年会費`}
                        onMarkPaid={() => updateFeeStatus(row.months[0].feeId as string, "paid", "cash")}
                        onRevert={() => updateFeeStatus(row.months[0].feeId as string, "unpaid")}
                        onChanged={onChanged}
                      />
                    </td>
                  ) : (
                    row.months.map((cell) => (
                      <td key={cell.month} className="px-1 py-1 text-center">
                        <FeeStatusToggle
                          size="icon"
                          status={cell.status}
                          disabled={!cell.feeId}
                          confirmDescription={`${row.name}さんの支払いステータスを「未払い」に戻します。`}
                          successLabel={`${row.name}さんの${cell.month}月分`}
                          onMarkPaid={() => updateFeeStatus(cell.feeId as string, "paid", "cash")}
                          onRevert={() => updateFeeStatus(cell.feeId as string, "unpaid")}
                          onChanged={onChanged}
                        />
                      </td>
                    ))
                  )}
                  <td className="sticky right-0 z-10 bg-white px-0.5">
                    <MemberMenu
                      swimmerId={row.swimmerId}
                      memberName={row.name}
                      isAdmin={row.role === "admin"}
                      isRemoving={removingId === row.swimmerId}
                      onOpen={onOpenMember}
                      onRemove={onRemoveMember}
                    />
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
