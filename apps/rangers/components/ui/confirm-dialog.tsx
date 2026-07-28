"use client"

import { createPortal } from "react-dom"
import { useMounted } from "@/hooks/use-mounted"
import { useScrollLock } from "@/hooks/use-scroll-lock"
import { useEscapeToClose } from "@/hooks/use-escape-to-close"

interface ConfirmDialogProps {
  /** ダイアログを表示するかどうか */
  open: boolean
  /** 確認メッセージのタイトル（元の window.confirm() の1行目相当） */
  title: string
  /** 補足説明（元の window.confirm() の2行目以降相当・任意） */
  description?: string
  /** 確認ボタンのラベル（例:「削除する」「中止する」） */
  confirmLabel?: string
  /** キャンセルボタンのラベル（例:「戻る」） */
  cancelLabel?: string
  /** 処理中かどうか（true の間はボタンを disabled にする） */
  isLoading?: boolean
  /** 処理中に確認ボタンへ表示するラベル */
  loadingLabel?: string
  /** danger: 赤い破壊的アクション用ボタン / primary: 青い通常アクション用ボタン */
  variant?: "danger" | "primary"
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 危険操作・確認が必要な操作向けの共通確認ダイアログ。
 * app/(app)/teams/[id]/member-list.tsx の DeleteConfirmModal のボトムシートUIを
 * 汎用化したもの。window.confirm() の代替として使用する。
 *
 * - モバイル: 画面下部からのボトムシート
 * - タブレット以上: 画面中央のモーダル
 * - ESCキー・背景幕クリックで閉じる（キャンセル扱い）
 * - ボタンは高さ44px以上でタッチターゲットを確保
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "確認する",
  cancelLabel = "戻る",
  isLoading = false,
  loadingLabel = "処理中...",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const mounted = useMounted()

  useEscapeToClose(open, onCancel)
  useScrollLock(open)

  if (!mounted || !open) return null

  const confirmButtonClass =
    variant === "danger"
      ? "bg-[#c0392b] hover:bg-[#a93226]"
      : "bg-[#005F8C] hover:bg-[#004E73]"

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl border border-[#dce3ea] bg-white shadow-xl sm:rounded-2xl">
        <div className="px-5 py-5">
          <p className="font-semibold text-[#1a2332]">{title}</p>
          {description && (
            <p className="mt-1.5 whitespace-pre-line text-sm text-[#475569]">{description}</p>
          )}
        </div>
        <div className="flex gap-2 border-t border-[#dce3ea] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-full border border-[#dce3ea] py-2.5 text-sm font-medium text-[#475569] transition-colors hover:border-[#005F8C] disabled:opacity-50"
            style={{ minHeight: "44px" }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${confirmButtonClass}`}
            style={{ minHeight: "44px" }}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
