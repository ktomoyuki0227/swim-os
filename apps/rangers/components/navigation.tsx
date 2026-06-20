"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface NavigationProps {
  userName: string
  avatarUrl?: string | null
  unreadCount?: number
}

const navLinks = [
  {
    href: "/dashboard",
    label: "ホーム",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/teams",
    label: "グループ",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "探す",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/payments",
    label: "お支払い",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

export function Navigation({ userName, avatarUrl, unreadCount = 0 }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()

  // ── LOGOUT_LOCATION_CHANGE_START ──────────────────────────────────────────
  // ログアウトをヘッダーのアバタードロップダウンに移動。
  // 元に戻すには: ここから LOGOUT_LOCATION_CHANGE_END まで削除し、
  // profile/page.tsx の「/* LOGOUT_BUTTON_REMOVED」コメントブロックを復元。
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    router.push("/login")
  }
  // ── LOGOUT_LOCATION_CHANGE_END ────────────────────────────────────────────

  const initials = userName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"))

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#dce3ea] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/rangers-logo-背景透過.png" alt="Rangers logo" width={40} height={40} className="object-contain" />
            <Image src="/rangers-name-背景透過.png" alt="Rangers" width={110} height={30} className="object-contain" />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-[#005F8C]/10 text-[#005F8C]"
                    : "text-[#5c6a7a] hover:bg-[#f2f7fa] hover:text-[#1a2332]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Bell + Avatar */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#5c6a7a] transition-colors hover:bg-[#f2f7fa] hover:text-[#1a2332]"
              aria-label="通知"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8614D] text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* ── LOGOUT_LOCATION_CHANGE_START ── Avatar dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C] ring-1 ring-[#dce3ea] transition-opacity hover:opacity-80"
                aria-label={`${userName}のメニュー`}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-[#dce3ea] bg-white shadow-lg">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1a2332] hover:bg-[#f2f7fa]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    プロフィール
                  </Link>
                  <div className="border-t border-[#f2f7fa]" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#E8614D] hover:bg-[#fff5f4]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    ログアウト
                  </button>
                </div>
              )}
            </div>
            {/* ── LOGOUT_LOCATION_CHANGE_END ── */}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#dce3ea] bg-white md:hidden">
        <div className="flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive(link.href)
                  ? "text-[#005F8C]"
                  : "text-[#8d99a8]"
              )}
            >
              <span className={cn(
                "flex h-6 w-6 items-center justify-center",
                isActive(link.href) && "text-[#005F8C]"
              )}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
