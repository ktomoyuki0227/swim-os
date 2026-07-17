"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

interface TeamSearchInputProps {
  defaultValue?: string
  sort?: string
  recruitingOnly?: boolean
  days?: string[]
}

export function TeamSearchInput({
  defaultValue = "",
  sort = "newest",
  recruitingOnly = false,
  days = [],
}: TeamSearchInputProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() || ""
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (sort !== "newest") p.set("sort", sort)
    if (recruitingOnly) p.set("recruiting", "1")
    if (days.length > 0) p.set("days", days.join(","))
    router.push(`/search/teams?${p.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d99a8]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          defaultValue={defaultValue}
          placeholder="チーム名で検索..."
          style={{ minHeight: "40px" }}
          className="w-full rounded-full border border-[#dce3ea] bg-[#f2f7fa] py-2 pl-9 pr-4 text-sm text-[#1a2332] placeholder:text-[#8d99a8] focus:border-[#0f8a4f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a4f]/20"
        />
      </div>
    </form>
  )
}
