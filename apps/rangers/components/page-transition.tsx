"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// BackLink から呼び出して「次の遷移は戻る」とマーク（クロスレイアウト用）
let pendingBack = false
export function markBackNavigation() {
  pendingBack = true
}

interface PageTransitionProps {
  children: React.ReactNode
}

// 横スライドするパス
const SLIDE_PATHS = ["/dashboard", "/teams", "/search", "/payments"]
// フェードインするパス
const FADE_PATHS = ["/notifications", "/profile"]

// 前のパスが現在のパスの子階層かどうか（例: /teams/abc → /teams）
function isGoingUp(prevPath: string, currentPath: string): boolean {
  return prevPath !== currentPath && prevPath.startsWith(currentPath + "/")
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // マウント時: pendingBack または sessionStorage のパス比較で方向決定
  const [direction, setDirection] = useState<"forward" | "back">(() => {
    if (pendingBack) {
      pendingBack = false
      return "back"
    }
    if (typeof window !== "undefined") {
      const prev = sessionStorage.getItem("pt-prev") || ""
      if (isGoingUp(prev, pathname)) return "back"
    }
    return "forward"
  })
  const [animKey, setAnimKey] = useState(pathname)

  // 現在のパスを sessionStorage に保存（クロスレイアウト遷移で参照される）
  useEffect(() => {
    sessionStorage.setItem("pt-prev", pathname)
  }, [pathname])

  // レイアウト内のパス変更時にアニメーション方向を決定
  useEffect(() => {
    if (prevPathname.current === pathname) return

    const goingUp = isGoingUp(prevPathname.current, pathname)
    prevPathname.current = pathname

    if (pendingBack || goingUp) {
      setDirection("back")
      pendingBack = false
    } else {
      setDirection("forward")
    }
    setAnimKey(pathname)
  }, [pathname])

  const isSlide = SLIDE_PATHS.includes(pathname)
  const isFade = FADE_PATHS.some((p) => pathname.startsWith(p))

  const animClass = isSlide
    ? (direction === "back" ? "animate-slide-in-left" : "animate-slide-in-right")
    : isFade
      ? "animate-fade-in"
      : undefined

  // 検索サブページ（/search/sessions など）はページ側でヘッダー直下に貼り付けるため pt-6 を外す
  const noTopPad = /^\/search\/.+/.test(pathname)

  return (
    <div key={animKey} className={[animClass, noTopPad ? "" : "pt-6"].filter(Boolean).join(" ") || undefined}>
      {children}
    </div>
  )
}
