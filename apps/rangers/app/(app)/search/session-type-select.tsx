"use client"

import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

const OPTIONS = [
  { key: "all", label: "すべての種別" },
  { key: "practice", label: "練習" },
  { key: "camp", label: "合宿" },
  { key: "competition", label: "大会" },
  { key: "event", label: "イベント" },
  { key: "meeting", label: "ミーティング" },
]

interface SessionTypeSelectProps {
  currentValue: string
  currentQ?: string
}

export function SessionTypeSelect({ currentValue, currentQ }: SessionTypeSelectProps) {
  const router = useRouter()

  function handleChange(value: string) {
    const p = new URLSearchParams()
    if (currentQ) p.set("q", currentQ)
    if (value !== "all") p.set("sessionType", value)
    router.push(`/search/sessions?${p.toString()}`)
  }

  const isActive = currentValue !== "all"

  return (
    <div className="relative w-44">
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        style={{ minHeight: "44px" }}
        className={`w-full appearance-none rounded-full border bg-white pl-4 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30 ${
          isActive
            ? "border-[#005F8C] font-medium text-[#005F8C]"
            : "border-[#dce3ea] text-[#1a2332]"
        }`}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
          isActive ? "text-[#005F8C]" : "text-[#5c6a7a]"
        }`}
        aria-hidden="true"
      />
    </div>
  )
}
