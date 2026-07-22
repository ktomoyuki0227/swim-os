"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { MemberList } from "./member-list"
import { AnnouncementsSection } from "./announcements-section"
import { JoinRequestsTab } from "./join-requests-tab"
import type { TeamMemberWithProfile } from "@/types/database"

type SheetType = "members" | "announcements" | "requests" | null

interface JoinRequest {
  id: string
  membership_type: string
  created_at: string
  swimmer: { id: string; name: string; avatar_url: string | null; furigana: string | null }
}

interface Props {
  teamId: string
  members: TeamMemberWithProfile[]
  currentUserId: string
  announcements: Array<{ id: string; title: string; body: string | null; created_at: string }>
  joinRequests: JoinRequest[]
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
}

export function AdminTeamActions({
  teamId,
  members,
  currentUserId,
  announcements,
  joinRequests,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  pointCardCount,
}: Props) {
  const [openSheet, setOpenSheet] = useState<SheetType>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // シート: ESC + スクロールロック
  useEffect(() => {
    if (!openSheet) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSheet(null)
    }
    document.addEventListener("keydown", handleEsc)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [openSheet])

  // その他ドロップダウン: 外部クリック
  useEffect(() => {
    if (!moreOpen) return
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [moreOpen])

  const sheetTitles: Record<string, string> = {
    members: `メンバー (${members.length})`,
    announcements: `お知らせ (${announcements.length})`,
    requests: `申請 (${joinRequests.length})`,
  }

  return (
    <>
      {/* 3つのアクションボタン */}
      <div className="grid grid-cols-3 gap-2">
        {/* セッション作成 */}
        <Link
          href={`/sessions/new?team=${teamId}`}
          className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-[#dce3ea] bg-white px-2 py-2.5 text-[#1a2332] transition-colors hover:border-[#005F8C] hover:bg-[#f2f7fa]"
          style={{ minHeight: 56 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          <span className="text-[11px] font-medium leading-tight">セッション作成</span>
        </Link>

        {/* メンバー */}
        <button
          onClick={() => setOpenSheet("members")}
          className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-[#dce3ea] bg-white px-2 py-2.5 text-[#1a2332] transition-colors hover:border-[#005F8C] hover:bg-[#f2f7fa]"
          style={{ minHeight: 56 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-[11px] font-medium leading-tight">メンバー</span>
        </button>

        {/* その他 */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-[14px] border border-[#dce3ea] bg-white px-2 py-2.5 text-[#1a2332] transition-colors hover:border-[#005F8C] hover:bg-[#f2f7fa]"
            style={{ minHeight: 56 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
            <span className="text-[11px] font-medium leading-tight">その他</span>
          </button>

          {moreOpen && (
            <div className="absolute right-0 top-full z-[200] mt-1 w-44 overflow-hidden rounded-[10px] border border-[#dce3ea] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
              <button
                onClick={() => { setMoreOpen(false); setOpenSheet("announcements") }}
                className="flex w-full items-center gap-3 px-4 text-sm text-[#1a2332] transition-colors hover:bg-[#f2f7fa]"
                style={{ minHeight: 44 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                お知らせ
                {announcements.length > 0 && (
                  <span className="ml-auto rounded-full bg-[#edf0f4] px-2 py-0.5 text-sm text-[#475569]">{announcements.length}</span>
                )}
              </button>
              <div className="mx-3 h-px bg-[#e8edf2]" />
              <button
                onClick={() => { setMoreOpen(false); setOpenSheet("requests") }}
                className="flex w-full items-center gap-3 px-4 text-sm text-[#1a2332] transition-colors hover:bg-[#f2f7fa]"
                style={{ minHeight: 44 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                申請
                {joinRequests.length > 0 && (
                  <span className="ml-auto rounded-full bg-[#005F8C] px-2 py-0.5 text-sm font-semibold text-white">{joinRequests.length}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── ボトムシート（Portal で body 直下に描画） ── */}
      {mounted && openSheet && createPortal(
        <div
          className="fixed inset-0 z-[300] flex flex-col"
          style={{ minHeight: "100dvh" }}
        >
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpenSheet(null)} />
          <div
            className="relative z-[400] mt-auto flex max-h-[92dvh] w-full flex-col rounded-t-[14px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:mx-auto sm:my-auto sm:mt-auto sm:max-w-lg sm:rounded-[14px]"
          >
            {/* ヘッダー */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8edf2] px-4 py-3">
              <button
                onClick={() => setOpenSheet(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f2f7fa]"
                aria-label="閉じる"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-base font-semibold text-[#1a2332]">
                {sheetTitles[openSheet] || ""}
              </span>
              <div className="w-9" />
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {openSheet === "members" && (
                <MemberList
                  teamId={teamId}
                  members={members}
                  currentUserId={currentUserId}
                  hasAnnualFee={hasAnnualFee}
                  hasMonthlyFee={hasMonthlyFee}
                  hasPointCard={hasPointCard}
                  pointCardCount={pointCardCount}
                />
              )}
              {openSheet === "announcements" && (
                <AnnouncementsSection teamId={teamId} announcements={announcements} />
              )}
              {openSheet === "requests" && (
                <JoinRequestsTab teamId={teamId} initialRequests={joinRequests} />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
