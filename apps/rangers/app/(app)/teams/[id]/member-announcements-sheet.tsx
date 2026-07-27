"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Card, CardContent } from "@/components/ui/card"
import { MarkReadButton } from "./mark-read-button"
import { useMounted } from "@/hooks/use-mounted"

interface Announcement {
  id: string
  title: string
  body: string | null
  created_at: string
  is_read: boolean
}

interface MemberAnnouncementsSheetProps {
  announcements: Announcement[]
}

export function MemberAnnouncementsSheet({ announcements: initialAnnouncements }: MemberAnnouncementsSheetProps) {
  const [open, setOpen] = useState(false)
  const mounted = useMounted()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // 動的な未読数（実データとローカル既読の両方を考慮）
  const currentUnread = initialAnnouncements.filter(
    (a) => !a.is_read && !readIds.has(a.id)
  ).length

  const handleRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id))
  }, [])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleEsc)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* ベルアイコンボタン */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
        aria-label="お知らせ"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {currentUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c0392b] text-[10px] font-bold text-white">
            {currentUnread > 9 ? "9+" : currentUnread}
          </span>
        )}
      </button>

      {/* ボトムシート */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[300] flex flex-col"
          style={{ minHeight: "100dvh" }}
        >
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div
            className="relative z-[400] mt-auto flex max-h-[92dvh] w-full flex-col rounded-t-[14px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:mx-auto sm:my-auto sm:mt-auto sm:max-w-lg sm:rounded-[14px]"
          >
            {/* ヘッダー */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8edf2] px-4 py-3">
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f2f7fa]"
                aria-label="閉じる"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-base font-semibold text-[#1a2332]">
                お知らせ{currentUnread > 0 ? ` (${currentUnread}件の未読)` : ""}
              </span>
              <div className="w-9" />
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
              {initialAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center py-12 px-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-[#1a2332]">お知らせはありません</p>
                  <p className="mt-1 text-sm text-[#475569]">グループからのお知らせが届くと表示されます</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {initialAnnouncements.map((announcement) => {
                    const isRead = announcement.is_read || readIds.has(announcement.id)
                    return (
                      <Card
                        key={announcement.id}
                        className={`border-[#dce3ea] ${!isRead ? "border-l-4 border-l-[#005F8C]" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className={`text-sm ${!isRead ? "font-semibold text-[#1a2332]" : "font-medium text-[#1a2332]"}`}>
                                {announcement.title}
                              </p>
                              {announcement.body && (
                                <p className="mt-1 text-sm text-[#475569]">{announcement.body}</p>
                              )}
                              <p className="mt-2 text-xs text-[#64748b]">
                                {new Date(announcement.created_at).toLocaleDateString("ja-JP")}
                              </p>
                            </div>
                            {!isRead && (
                              <MarkReadButton
                                announcementId={announcement.id}
                                onRead={() => handleRead(announcement.id)}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
