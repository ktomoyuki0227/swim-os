"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

interface PersonalSearchInputProps {
  defaultValue?: string
}

export function PersonalSearchInput({ defaultValue = "" }: PersonalSearchInputProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() || ""
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    router.push(`/search/personal?${p.toString()}`)
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
          placeholder="コーチ名で検索..."
          style={{ minHeight: "40px" }}
          className="w-full rounded-full border border-[#dce3ea] bg-[#f2f7fa] py-2 pl-9 pr-4 text-sm text-[#1a2332] placeholder:text-[#8d99a8] focus:border-[#7B5EA7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B5EA7]/20"
        />
      </div>
    </form>
  )
}
