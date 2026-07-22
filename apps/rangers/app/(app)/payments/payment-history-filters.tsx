"use client"

import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

interface PaymentHistoryFiltersProps {
  selectedType: string
  selectedSort: string
}

export function PaymentHistoryFilters({ selectedType, selectedSort }: PaymentHistoryFiltersProps) {
  const router = useRouter()

  function update(key: "type" | "sort", value: string) {
    const p = new URLSearchParams()
    // 変更しない方のパラメータを保持する
    if (key !== "type" && selectedType) p.set("type", selectedType)
    if (key !== "sort" && selectedSort) p.set("sort", selectedSort)
    if (value) p.set(key, value)
    router.push(`/payments?${p.toString()}`)
  }

  function getSelectClass(isActive: boolean) {
    return `w-full appearance-none rounded-full border bg-white pl-4 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30 ${
      isActive
        ? "border-[#005F8C] text-[#005F8C] font-medium"
        : "border-[#dce3ea] text-[#1a2332]"
    }`
  }

  const typeActive = selectedType !== ""

  return (
    <div className="flex gap-2">
      {/* 種別フィルター */}
      <div className="relative flex-1">
        <select
          value={selectedType}
          onChange={(e) => update("type", e.target.value)}
          style={{ minHeight: "44px" }}
          className={getSelectClass(typeActive)}
        >
          <option value="">すべて</option>
          <option value="session">セッション参加費</option>
          <option value="fee">会費</option>
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${typeActive ? "text-[#005F8C]" : "text-[#475569]"}`}
          aria-hidden="true"
        />
      </div>

      {/* 並び替え（アクティブ強調なし） */}
      <div className="relative flex-1">
        <select
          value={selectedSort}
          onChange={(e) => update("sort", e.target.value)}
          style={{ minHeight: "44px" }}
          className={getSelectClass(false)}
        >
          <option value="">新着順</option>
          <option value="asc">古い順</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569]"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
