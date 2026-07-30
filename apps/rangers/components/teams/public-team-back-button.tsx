"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

interface PublicTeamBackButtonProps {
  /** 上に sticky ヘッダー（h-16）がある場合は true。ヘッダーのすぐ下に配置する。
   *  ヘッダーがない場合（プレビュー画面など）は画面左上ぴったりに配置する。 */
  hasHeader?: boolean
}

/**
 * ゲスト目線のチーム詳細ページ用の戻るボタン。
 * 左上に固定表示し、スクロールしても常に見える位置を保つ。
 */
export function PublicTeamBackButton({ hasHeader = true }: PublicTeamBackButtonProps) {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/search")
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="戻る"
      className={`fixed left-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1a2332] shadow-md backdrop-blur transition-colors hover:bg-white ${hasHeader ? "top-20" : "top-4"}`}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  )
}
