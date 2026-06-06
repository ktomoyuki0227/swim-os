"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"

interface Props {
  defaultValue?: string
  tab?: string
}

export function SearchBar({ defaultValue = "", tab = "sessions" }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() || ""
    const params = new URLSearchParams({ tab })
    if (q) params.set("q", q)
    router.push(`/search?${params.toString()}`)
  }

  const placeholder = tab === "teams" ? "チーム名で検索..." : "場所やキーワードで検索..."

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-[#dce3ea] bg-white px-4 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
      />
      <button
        type="submit"
        className="rounded-full bg-[#005F8C] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004E73]"
        style={{ minHeight: "44px" }}
      >
        検索
      </button>
    </form>
  )
}
