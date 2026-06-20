"use client"

interface FeeFiltersProps {
  teams: { id: string; name: string }[]
  selectedTeamId: string
  selectedType: "annual" | "monthly" | "stamp_card"
  selectedPeriod: string
}

export function FeeFilters({ teams, selectedTeamId, selectedType, selectedPeriod }: FeeFiltersProps) {
  const now = new Date()

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {/* Team selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#5c6a7a]">グループ</label>
        <select
          name="team"
          defaultValue={selectedTeamId}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("team", e.target.value)
            window.location.href = url.toString()
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

      {/* Type selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#5c6a7a]">種別</label>
        <div className="flex overflow-hidden rounded-lg border border-[#dce3ea]">
          {(["annual", "monthly", "stamp_card"] as const).map((type) => (
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
                  : "text-[#5c6a7a] hover:bg-[#f2f7fa]"
              }`}
            >
              {type === "annual" ? "年会費" : type === "monthly" ? "月謝" : "回数券"}
            </a>
          ))}
        </div>
      </div>

      {/* Period（回数券タブでは非表示）*/}
      {selectedType !== "stamp_card" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#5c6a7a]">
            {selectedType === "annual" ? "年度" : "月"}
          </label>
          <input
            type={selectedType === "annual" ? "number" : "month"}
            defaultValue={selectedPeriod}
            onBlur={(e) => {
              if (e.target.value) {
                window.location.href = `/fees?team=${selectedTeamId}&type=${selectedType}&period=${e.target.value}`
              }
            }}
            className="h-9 rounded-lg border border-[#dce3ea] px-3 text-sm text-[#1a2332] focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
