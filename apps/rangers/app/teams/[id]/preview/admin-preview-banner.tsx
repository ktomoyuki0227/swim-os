"use client"

import Link from "next/link"
import { useState } from "react"

interface AdminPreviewBannerProps {
  teamId: string
}

export function AdminPreviewBanner({ teamId }: AdminPreviewBannerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="sticky top-0 z-20 bg-[#1a2332] px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-sm font-medium">ゲスト目線のプレビュー</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-full border border-white/30 px-3 py-1 text-sm transition-colors hover:bg-white/10 active:scale-95"
          >
            {copied ? "コピーしました！" : "URLをコピー"}
          </button>
          <Link
            href={`/teams/${teamId}`}
            className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/30"
          >
            管理画面へ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
