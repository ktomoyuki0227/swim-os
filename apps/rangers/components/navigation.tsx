"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/types/database"

interface NavigationProps {
  role: UserRole
  userName: string
  avatarUrl?: string | null
}

const swimmerLinks = [
  { href: "/lessons", label: "レッスン検索" },
  { href: "/bookings", label: "予約履歴" },
  { href: "/profile", label: "プロフィール" },
]

const instructorLinks = [
  { href: "/instructor/dashboard", label: "ダッシュボード" },
  { href: "/instructor/lessons", label: "レッスン管理" },
  { href: "/profile", label: "プロフィール" },
]

export function Navigation({ role, userName, avatarUrl }: NavigationProps) {
  const pathname = usePathname()
  const links = role === "instructor" ? instructorLinks : swimmerLinks
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = userName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="border-b bg-background shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">
            Rangers
          </Link>
          <nav className="hidden gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === link.href || (link.href !== "/profile" && pathname.startsWith(link.href + "/"))
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/profile" aria-label={`${userName}のプロフィール`}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground ring-1 ring-border">
                {initials}
              </span>
            )}
          </Link>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              ログアウト
            </Button>
          </form>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="メニュー"
          aria-expanded={menuOpen}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="animate-in slide-in-from-top-2 fade-in border-t px-4 pb-4 pt-2 duration-150 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === link.href || (link.href !== "/profile" && pathname.startsWith(link.href + "/"))
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <Link href="/profile" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={userName}
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {initials}
                </span>
              )}
              <span className="text-sm text-muted-foreground">{userName}</span>
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                ログアウト
              </Button>
            </form>
          </div>
        </nav>
      )}
    </header>
  )
}
