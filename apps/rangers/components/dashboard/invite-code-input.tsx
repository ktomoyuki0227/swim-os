"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// 招待URL全体(https://.../teams/join/{uuid})を貼り付けた場合でも、
// UUID部分だけを抽出して参加できるようにする。招待コードはコピー元の
// InviteButton がURL全体をコピー体験として提供しているため、
// ユーザーはコードそのものよりURLを貼り付けがちなことを想定している
function extractInviteCode(input: string): string {
  const match = input.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  return match ? match[1] : input.trim()
}

export function InviteCodeInput() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const router = useRouter()

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = extractInviteCode(code)
    if (trimmed) router.push(`/teams/join/${trimmed}`)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce3ea] bg-white px-4 py-3 text-sm font-medium text-[#475569] transition-colors hover:border-[#005F8C] hover:text-[#005F8C]"
        style={{ minHeight: "44px" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
        招待コードで参加
      </button>
    )
  }

  return (
    <form onSubmit={handleJoin} className="flex gap-2">
      <input
        autoFocus
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="招待コードまたはURLを入力..."
        className="flex-1 rounded-xl border border-[#005F8C] bg-white px-4 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="rounded-xl bg-[#005F8C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004E73] disabled:opacity-40"
        style={{ minHeight: "44px" }}
      >
        参加
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setCode("") }}
        className="rounded-xl border border-[#dce3ea] px-3 py-2.5 text-sm text-[#64748b] transition-colors hover:bg-[#f2f7fa]"
        style={{ minHeight: "44px" }}
      >
        キャンセル
      </button>
    </form>
  )
}
