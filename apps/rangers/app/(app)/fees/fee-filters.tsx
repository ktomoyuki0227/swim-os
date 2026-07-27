"use client"

import { useRouter } from "next/navigation"

interface FeeFiltersProps {
  teams: { id: string; name: string }[]
  selectedTeamId: string
  selectedType: "annual" | "monthly" | "stamp_card"
  selectedPeriod: string
  teamFeeFlags: {
    has_annual_fee: boolean
    has_monthly_fee: boolean
    has_point_card: boolean
  }
}

export function FeeFilters({ teams, selectedTeamId, selectedType, selectedPeriod, teamFeeFlags }: FeeFiltersProps) {
  const router = useRouter()
  const now = new Date()

  const tabs = [
    { type: "annual" as const, label: "年会費", enabled: teamFeeFlags.has_annual_fee },
    { type: "monthly" as const, label: "月謝", enabled: teamFeeFlags.has_monthly_fee },
    { type: "stamp_card" as const, label: "回数券", enabled: teamFeeFlags.has_point_card },
  ].filter((t) => t.enabled)

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {/* Team selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#475569]">グループ</label>
        <select
          name="team"
          defaultValue={selectedTeamId}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("team", e.target.value)
            url.searchParams.delete("type")
            url.searchParams.delete("period")
            router.push(`${url.pathname}${url.search}`)
          }}
          className="h-9 rounded-lg border border-[#dce3ea] px-3 text-sm text-[#1a2332] focus:outline-none"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type selector — enabled tabs only */}
      {tabs.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">種別</label>
          <div className="flex overflow-hidden rounded-lg border border-[#dce3ea]">
            {tabs.map(({ type, label }) => (
              <a
                key={type}
                href={`/fees?team=${selectedTeamId}&type=${type}${
                  type !== "stamp_card"
                    ? `&period=${type === "annual" ? now.getFullYear().toString() : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}`
                    : ""
                }`}
                className={`px-3 py-1.5 text-sm ${
                  selectedType === type
                    ? "bg-[#005F8C] text-white"
                    : "text-[#475569] hover:bg-[#f2f7fa]"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Period（回数券タブでは非表示）*/}
      {tabs.length > 0 && selectedType !== "stamp_card" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">
            {selectedType === "annual" ? "年度" : "月"}
          </label>
          <input
            type={selectedType === "annual" ? "number" : "month"}
            defaultValue={selectedPeriod}
            onBlur={(e) => {
              if (e.target.value) {
                router.push(`/fees?team=${selectedTeamId}&type=${selectedType}&period=${e.target.value}`)
              }
            }}
            className="h-9 rounded-lg border border-[#dce3ea] px-3 text-sm text-[#1a2332] focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
