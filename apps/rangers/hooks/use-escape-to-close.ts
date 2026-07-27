"use client"

import { useEffect } from "react"

/**
 * モーダル・ボトムシート表示中にEscキーで閉じられるようにする。
 * 複数のモーダル/シートコンポーネントで重複していた実装を集約した。
 */
export function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("keydown", handleEsc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])
}
