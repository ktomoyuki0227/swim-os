"use client"

import { useRouter } from "next/navigation"

interface FilterOption {
  key: string
  label: string
}

interface FilterChipsProps {
  options: FilterOption[]
  paramKey: string
  currentValue: string
  currentParams: string
}

export function FilterChips({ options, paramKey, currentValue, currentParams }: FilterChipsProps) {
  const router = useRouter()

  function select(value: string) {
    const p = new URLSearchParams(currentParams)
    if (value === "all") {
      p.delete(paramKey)
    } else {
      p.set(paramKey, value)
    }
    router.push(`/search?${p.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const isSelected = option.key === currentValue
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => select(option.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[#005F8C] text-white"
                : "bg-[#f2f7fa] text-[#475569] hover:bg-[#e0edf5] hover:text-[#005F8C]"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
