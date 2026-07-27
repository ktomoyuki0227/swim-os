import { createPortal } from "react-dom"
import { Card, CardContent } from "@/components/ui/card"
import { SYSTEM_TAGS } from "@/types/database"
import type { TeamMemberOption } from "./types"

interface StepAudienceProps {
  teamMembers: TeamMemberOption[]
  selectedMemberIds: string[]
  setSelectedMemberIds: (updater: (prev: string[]) => string[]) => void
  selectedTags: string[]
  setSelectedTags: (updater: string[] | ((prev: string[]) => string[])) => void
  openTagCategory: string | null
  setOpenTagCategory: (category: string | null) => void
  portalMounted: boolean
  membersLoading: boolean
  tagsByCategory: Record<string, typeof SYSTEM_TAGS[number][]>
}

export function StepAudience({
  teamMembers,
  selectedMemberIds,
  setSelectedMemberIds,
  selectedTags,
  setSelectedTags,
  openTagCategory,
  setOpenTagCategory,
  portalMounted,
  membersLoading,
  tagsByCategory,
}: StepAudienceProps) {
  const sortedMembers = [...teamMembers].sort((a, b) => {
    const aId = a.swimmer.id
    const bId = b.swimmer.id
    const aChecked = selectedMemberIds.includes(aId)
    const bChecked = selectedMemberIds.includes(bId)
    if (aChecked && !bChecked) return -1
    if (!aChecked && bChecked) return 1
    return a.swimmer.name.localeCompare(b.swimmer.name, "ja")
  })
  const untaggedCount = teamMembers.filter((m) => {
    const sw = m.swimmer
    return (
      !sw?.level &&
      (sw?.specialties || []).length === 0 &&
      (sw?.swimming_goals || []).length === 0 &&
      !sw?.swimmer_type &&
      (sw?.swim_disciplines || []).length === 0
    )
  }).length
  const allChecked = teamMembers.length > 0 && teamMembers.every(
    (m) => selectedMemberIds.includes(m.swimmer.id)
  )

  return (
    <div className="space-y-3">
      {/* フィルターピル行 */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Object.entries(tagsByCategory).map(([category, tags]) => {
          const selectedCount = tags.filter((t) => selectedTags.includes(t.id)).length
          const isActive = selectedCount > 0
          const isOpen = openTagCategory === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => setOpenTagCategory(isOpen ? null : category)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[#005F8C] bg-[#005F8C] text-white"
                  : "border-[#dce3ea] bg-white text-[#1a2332] hover:border-[#005F8C] hover:text-[#005F8C]"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              <span>{category}</span>
              {isActive && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold">
                  {selectedCount}
                </span>
              )}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )
        })}
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="shrink-0 rounded-full border border-[#dce3ea] bg-white px-3 py-1.5 text-sm text-[#c0392b] hover:border-[#c0392b]"
          >
            リセット
          </button>
        )}
      </div>

      {/* カテゴリボトムシート */}
      {portalMounted && openTagCategory !== null && (() => {
        const sheetTags = tagsByCategory[openTagCategory] ?? []
        return createPortal(
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpenTagCategory(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] bg-white shadow-2xl">
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-[#dce3ea]" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="text-base font-semibold text-[#1a2332]">{openTagCategory}</h3>
                <button
                  type="button"
                  onClick={() => setOpenTagCategory(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f7fa] text-[#475569] hover:bg-[#e0edf5]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="px-3 pb-10">
                {sheetTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          isSelected ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                        )
                      }
                      style={isSelected ? { backgroundColor: "rgba(0,95,140,0.08)" } : undefined}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm transition-colors ${
                        isSelected ? "font-semibold text-[#005F8C]" : "text-[#1a2332] hover:bg-[#f2f7fa]"
                      }`}
                    >
                      <span>{tag.label}</span>
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2.5" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>,
          document.body
        )
      })()}

      {/* メンバーリスト */}
      <Card className="border-[#dce3ea]">
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#475569]">
                メンバー一覧（{selectedMemberIds.length}/{teamMembers.length}人 選択中）
              </p>
              {untaggedCount > 0 && (
                <p className="mt-0.5 text-xs text-[#64748b]">※ タグ未設定 {untaggedCount}人あり</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (allChecked) {
                  setSelectedMemberIds(() => [])
                } else {
                  setSelectedMemberIds(() => teamMembers.map((m) => m.swimmer.id))
                }
              }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                allChecked
                  ? "bg-[#005F8C] text-white"
                  : "border border-[#dce3ea] bg-white text-[#475569] hover:border-[#005F8C]"
              }`}
            >
              {allChecked ? "全解除" : "全選択"}
            </button>
          </div>

          {membersLoading ? (
            <p className="py-8 text-center text-sm text-[#64748b]">読み込み中...</p>
          ) : teamMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748b]">メンバーがいません</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {sortedMembers.map((m) => {
                const swimmer = m.swimmer
                const id = swimmer.id
                const isChecked = selectedMemberIds.includes(id)
                const memberTagLabels = [
                  swimmer.level,
                  ...(swimmer.specialties || []).slice(0, 2),
                ].filter(Boolean)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setSelectedMemberIds((prev) =>
                        isChecked ? prev.filter((x) => x !== id) : [...prev, id]
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isChecked ? "bg-[#e8f2f8]" : "opacity-50 hover:opacity-80 hover:bg-[#f2f7fa]"
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      isChecked ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"
                    }`}>
                      {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-bold text-[#005F8C]">
                      {swimmer.name?.[0] || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1a2332]">{swimmer.name}</p>
                      {memberTagLabels.length > 0 && (
                        <p className="truncate text-xs text-[#64748b]">{memberTagLabels.join(" · ")}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
