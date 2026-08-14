interface StampDashboardProps {
  paidCount: number
  unpaidCount: number
  paidAmount: number
  totalAmount: number
  lowBalanceCount: number
}

/**
 * 回数券のお金回りのダッシュボード。年会費・月謝の「支払済み/未払い/¥金額」サマリーと
 * 同じ見た目のカードに揃えつつ、回数券特有の「残数0(要再購入)の会員数」を追加した。
 * 「すべて」表示時は会員一覧テーブルの下に、「回数券」表示時は一覧の上に置く想定
 * (fees-manager.tsx 参照)。
 */
export function StampDashboard({ paidCount, unpaidCount, paidAmount, totalAmount, lowBalanceCount }: StampDashboardProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#dce3ea] bg-white p-3 text-center">
          <p className="text-xl font-bold text-[#0f8a4f]">{paidCount}</p>
          <p className="text-xs text-[#475569]">支払済み</p>
        </div>
        <div className="rounded-2xl border border-[#dce3ea] bg-white p-3 text-center">
          <p className="text-xl font-bold text-[#b8860b]">{unpaidCount}</p>
          <p className="text-xs text-[#475569]">未払い</p>
        </div>
        <div className="rounded-2xl border border-[#dce3ea] bg-white p-3 text-center">
          <p className="text-base font-bold text-[#005F8C]">¥{paidAmount.toLocaleString()}</p>
          <p className="text-xs text-[#475569]">/ ¥{totalAmount.toLocaleString()}</p>
        </div>
      </div>
      {lowBalanceCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-[#f5d68a] bg-[#fdf6e3] px-3 py-2 text-xs text-[#8a6d1a]">
          <span aria-hidden="true">⚠</span>
          <span>残数0の会員が{lowBalanceCount}名います。再購入の声かけをおすすめします</span>
        </div>
      )}
    </div>
  )
}
