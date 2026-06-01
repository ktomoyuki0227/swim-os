"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"

interface Props {
  defaultValue?: string
}

export function SearchBar({ defaultValue = "" }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = inputRef.current?.value || ""
    const url = value ? `/search?location=${encodeURIComponent(value)}` : "/search"
    router.push(url)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        name="location"
        defaultValue={defaultValue}
        placeholder="場所で検索..."
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
