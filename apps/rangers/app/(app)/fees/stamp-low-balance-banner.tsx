interface StampLowBalanceBannerProps {
  count: number
}

/**
 * 回数券の残数が0(要再購入)の会員数を知らせる警告バナー。
 * 支払済み/未払い/合計金額は年会費・月謝と同じ意味を持つため fees-manager.tsx の
 * 共通サマリーに合算し、ここでは回数券固有の「残数0」情報だけを独立して伝える。
 */
export function StampLowBalanceBanner({ count }: StampLowBalanceBannerProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#f5d68a] bg-[#fdf6e3] px-3 py-2 text-xs text-[#8a6d1a]">
      <span aria-hidden="true">⚠</span>
      <span>回数券の残数が0の会員が{count}名います。再購入の声かけをおすすめします</span>
    </div>
  )
}
