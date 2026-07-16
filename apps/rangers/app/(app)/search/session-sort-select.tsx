"use client"

import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

const OPTIONS = [
  { key: "date_asc", label: "日時の早い順" },
  { key: "price_asc", label: "料金の安い順" },
  { key: "price_desc", label: "料金の高い順" },
]

interface SessionSortSelectProps {
  currentValue: string
  currentQ?: string
  currentSessionType?: string
}

export function SessionSortSelect({
  currentValue,
  currentQ,
  currentSessionType,
}: SessionSortSelectProps) {
  const router = useRouter()

  function handleChange(value: string) {
    const p = new URLSearchParams()
    if (currentQ) p.set("q", currentQ)
    if (currentSessionType && currentSessionType !== "all") p.set("sessionType", currentSessionType)
    if (value !== "date_asc") p.set("sort", value)
    router.push(`/search/sessions?${p.toString()}`)
  }

  return (
    <div className="relative flex-1">
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        style={{ minHeight: "44px" }}
        className="w-full appearance-none rounded-full border border-[#dce3ea] bg-white pl-4 pr-9 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6a7a]"
        aria-hidden="true"
      />
    </div>
  )
}
