"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { DEFAULT_MAX_PRICE } from "./session-price-config"

interface SessionSearchInputProps {
  defaultValue?: string
  sessionType?: string
  sort?: string
  dateRange?: string
  minPrice?: number
  maxPrice?: number
}

export function SessionSearchInput({
  defaultValue = "",
  sessionType,
  sort,
  dateRange,
  minPrice = 0,
  maxPrice = DEFAULT_MAX_PRICE,
}: SessionSearchInputProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() || ""
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (dateRange && dateRange !== "all") p.set("dateRange", dateRange)
    if (sessionType && sessionType !== "all") p.set("sessionType", sessionType)
    if (minPrice > 0) p.set("minPrice", String(minPrice))
    if (maxPrice !== DEFAULT_MAX_PRICE) p.set("maxPrice", String(maxPrice))
    if (sort && sort !== "date_asc") p.set("sort", sort)
    router.push(`/search/sessions?${p.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      <div className="relative">
        {/* 虫眼鏡アイコン */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
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
          placeholder="場所やキーワードで検索..."
          style={{ minHeight: "40px" }}
          className="w-full rounded-full border border-[#dce3ea] bg-[#f2f7fa] py-2 pl-9 pr-4 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:border-[#005F8C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005F8C]/20"
        />
      </div>
    </form>
  )
}
