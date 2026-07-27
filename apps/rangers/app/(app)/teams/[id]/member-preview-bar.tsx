"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useMounted } from "@/hooks/use-mounted"
import { useScrollLock } from "@/hooks/use-scroll-lock"
import { useEscapeToClose } from "@/hooks/use-escape-to-close"

interface MemberItem {
  id: string
  swimmer: {
    id: string
    name: string
    avatar_url: string | null
  } | null
}

interface MemberPreviewBarProps {
  members: MemberItem[]
}

export function MemberPreviewBar({ members }: MemberPreviewBarProps) {
  const [open, setOpen] = useState(false)
  const mounted = useMounted()
  const previewMembers = members.slice(0, 3)

  useEscapeToClose(open, () => setOpen(false))
  useScrollLock(open)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 rounded-full bg-[#f2f7fa] py-1.5 pl-2 pr-4 transition-colors hover:bg-[#edf0f4]"
      >
        <div className="flex -space-x-1.5">
          {previewMembers.map((m, i) => {
            const avatarUrl = m.swimmer?.avatar_url || null
            const name = m.swimmer?.name || ""
            return (
              <div
                key={m.id}
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#f2f7fa] bg-[#005F8C]/10 text-[10px] font-semibold text-[#005F8C]"
                style={{ zIndex: 3 - i }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  name[0] || "?"
                )}
              </div>
            )
          })}
        </div>
        <span className="text-sm font-medium text-[#1a2332]">{members.length}人のメンバー</span>
      </button>

      {/* メンバー一覧ボトムシート */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[300] flex flex-col"
          style={{ minHeight: "100dvh" }}
        >
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="relative z-[400] mt-auto flex max-h-[92dvh] w-full flex-col rounded-t-[14px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:mx-auto sm:my-auto sm:mt-auto sm:max-w-lg sm:rounded-[14px]">
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
              <span className="text-base font-semibold text-[#1a2332]">メンバー ({members.length})</span>
              <div className="w-9" />
            </div>

            {/* 一覧 */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
              {members.map((m) => {
                const swimmer = m.swimmer
                const avatarUrl = swimmer?.avatar_url || null
                const name = swimmer?.name || "不明"
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f7fa] last:border-b-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        name[0] || "?"
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1a2332]">{name}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
