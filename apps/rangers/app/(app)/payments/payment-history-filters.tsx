"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface PaymentHistoryFiltersProps {
  teams: { id: string; name: string }[]
  selectedTeam: string
  selectedType: string
}

const selectClass =
  "rounded-lg border border-[#dce3ea] bg-white px-3 py-2 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"

export function PaymentHistoryFilters({
  teams,
  selectedTeam,
  selectedType,
}: PaymentHistoryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/payments?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={selectedTeam}
        onChange={(e) => update("team", e.target.value)}
        className={selectClass}
      >
        <option value="">すべてのグループ</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value={selectedType}
        onChange={(e) => update("type", e.target.value)}
        className={selectClass}
      >
        <option value="">すべての種別</option>
        <option value="session">セッション参加費</option>
        <option value="annual">年会費</option>
        <option value="monthly">月謝</option>
      </select>
    </div>
  )
}
