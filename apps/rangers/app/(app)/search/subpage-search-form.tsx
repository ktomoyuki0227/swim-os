"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

interface SubpageSearchFormProps {
  defaultValue?: string
  placeholder: string
  actionPath: string
  preserveParams?: Record<string, string>
}

export function SubpageSearchForm({
  defaultValue = "",
  placeholder,
  actionPath,
  preserveParams,
}: SubpageSearchFormProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() || ""
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) p.set(k, v)
      }
    }
    router.push(`${actionPath}?${p.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{ minHeight: "44px" }}
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
