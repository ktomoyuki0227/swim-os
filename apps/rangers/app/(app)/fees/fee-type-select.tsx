"use client"

import { useEffect, useRef, useState } from "react"

export type FeeFilterType = "all" | "annual" | "monthly" | "stamp_card"

interface FeeTypeSelectProps {
  value: FeeFilterType
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  onChange: (next: FeeFilterType) => void
}

const TYPE_LABELS: Record<FeeFilterType, string> = {
  all: "すべて",
  annual: "年会費",
  monthly: "月謝",
  stamp_card: "回数券",
}

/** 会費管理ページの「種別」選択。4択のみなのでボトムシートではなく軽量なドロップダウンにしている */
export function FeeTypeSelect({ value, hasAnnualFee, hasMonthlyFee, hasPointCard, onChange }: FeeTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const options: FeeFilterType[] = [
    ...(hasAnnualFee || hasMonthlyFee ? (["all"] as const) : []),
    ...(hasAnnualFee ? (["annual"] as const) : []),
    ...(hasMonthlyFee ? (["monthly"] as const) : []),
    ...(hasPointCard ? (["stamp_card"] as const) : []),
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[46px] w-full items-center justify-center gap-1.5 text-sm font-medium text-[#005F8C]"
      >
        {TYPE_LABELS[value]}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-[#dce3ea] bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                opt === value ? "bg-[#e8f2f8] font-semibold text-[#005F8C]" : "text-[#1a2332] hover:bg-[#f2f7fa]"
              }`}
            >
              {TYPE_LABELS[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
