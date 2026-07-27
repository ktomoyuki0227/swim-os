"use client"

import { useEffect } from "react"

/**
 * モーダル・ボトムシート表示中に背景のスクロールを止める。
 * 複数のモーダル/シートコンポーネントで重複していた実装を集約した。
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isLocked])
}
