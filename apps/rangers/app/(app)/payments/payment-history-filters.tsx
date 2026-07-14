"use client"

import { useRouter } from "next/navigation"

const OPTIONS = [
  { value: "", label: "すべて" },
  { value: "session", label: "セッション参加費" },
  { value: "fee", label: "会費" },
] as const

interface PaymentHistoryFiltersProps {
  selectedType: string
}

export function PaymentHistoryFilters({ selectedType }: PaymentHistoryFiltersProps) {
  const router = useRouter()

  function select(value: string) {
    const p = new URLSearchParams()
    if (value) p.set("type", value)
    router.push(`/payments?${p.toString()}`)
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => {
        const isSelected = option.value === selectedType
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => select(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[#005F8C] text-white"
                : "bg-[#f2f7fa] text-[#5c6a7a] hover:bg-[#e0edf5] hover:text-[#005F8C]"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
