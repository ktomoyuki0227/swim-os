"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

type NavState = "idle" | "loading" | "completing"

export function NavigationProgress() {
  const pathname = usePathname()
  const [navState, setNavState] = useState<NavState>("idle")
  const prevRef = useRef(pathname)

  // ナビゲーション完了 → バーを100%に伸ばしてフェードアウト
  useEffect(() => {
    if (prevRef.current === pathname) return
    prevRef.current = pathname
    if (navState !== "loading") return
    setNavState("completing")
    const t = setTimeout(() => setNavState("idle"), 400)
    return () => clearTimeout(t)
  }, [pathname, navState])

  // リンククリック検知
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]")
      if (!anchor) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href || href.startsWith("#") || /^https?:\/\//.test(href) || href.startsWith("mailto:")) return
      try {
        const url = new URL(href, location.origin)
        if (url.origin !== location.origin) return
        if (url.pathname === pathname) return
      } catch { return }
      setNavState("loading")
    }
    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [pathname])

  if (navState === "idle") return null

  return (
    <>
      {/* ヘッダー下のプログレスバー */}
      <div className="fixed top-16 left-0 right-0 z-[1000] h-[2px]">
        <div
          className="h-full w-full bg-[#005F8C]"
          style={{
            transformOrigin: "left center",
            // loading: 1.5秒で85%まで伸びる
            // completing: 100%に即展開してフェードアウト
            animation: navState === "loading"
              ? "nav-progress 1.5s cubic-bezier(0.1, 0.05, 0, 1) forwards"
              : "none",
            transform: navState === "completing" ? "scaleX(1)" : undefined,
            opacity: navState === "completing" ? 0 : 1,
            transition: navState === "completing" ? "opacity 300ms ease" : undefined,
          }}
        />
      </div>
      {/* 右下スピナー（loading中のみ表示、完了と同時に消える） */}
      {navState === "loading" && (
        <div className="fixed bottom-20 right-4 z-[1000] md:bottom-8 md:right-8">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#005F8C]/20 border-t-[#005F8C]" />
        </div>
      )}
    </>
  )
}
