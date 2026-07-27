"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useMounted } from "@/hooks/use-mounted"
import { useScrollLock } from "@/hooks/use-scroll-lock"

const SESSION_TYPE_OPTIONS = [
  { key: "all", label: "すべて" },
  { key: "practice", label: "練習" },
  { key: "camp", label: "合宿" },
  { key: "competition", label: "大会" },
  { key: "event", label: "イベント" },
  { key: "meeting", label: "ミーティング" },
]

const TEAM_TYPE_OPTIONS = [
  { key: "all", label: "すべて" },
  { key: "team", label: "チーム" },
  { key: "personal", label: "パーソナル" },
]

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

const TEAM_TYPE_LABELS: Record<string, string> = {
  team: "チーム",
  personal: "パーソナル",
}

interface FilterGroupConfig {
  paramKey: string
  buttonLabel: string
  sheetTitle: string
  options: { key: string; label: string }[]
  currentValue: string
}

interface SearchFiltersBarProps {
  tab: string
  sessionType: string
  teamType: string
  currentParams: string
}

export function SearchFiltersBar({
  tab,
  sessionType,
  teamType,
  currentParams,
}: SearchFiltersBarProps) {
  const router = useRouter()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const mounted = useMounted()

  // ボトムシート表示中はボディのスクロールを止める
  useScrollLock(openGroup !== null)

  const filterGroups: FilterGroupConfig[] =
    tab === "sessions"
      ? [
          {
            paramKey: "sessionType",
            buttonLabel:
              sessionType !== "all"
                ? (SESSION_TYPE_LABELS[sessionType] ?? "種別")
                : "種別",
            sheetTitle: "セッション種別",
            options: SESSION_TYPE_OPTIONS,
            currentValue: sessionType,
          },
        ]
      : [
          {
            paramKey: "teamType",
            buttonLabel:
              teamType !== "all"
                ? (TEAM_TYPE_LABELS[teamType] ?? "種別")
                : "種別",
            sheetTitle: "グループ種別",
            options: TEAM_TYPE_OPTIONS,
            currentValue: teamType,
          },
        ]

  function applyFilter(paramKey: string, value: string) {
    const p = new URLSearchParams(currentParams)
    if (value === "all") {
      p.delete(paramKey)
    } else {
      p.set(paramKey, value)
    }
    router.push(`/search?${p.toString()}`)
    setOpenGroup(null)
  }

  const activeGroup =
    openGroup !== null
      ? (filterGroups.find((g) => g.paramKey === openGroup) ?? null)
      : null

  return (
    <>
      {/* フィルターボタン行 */}
      <div className="flex gap-2">
        {filterGroups.map((group) => {
          const isActive = group.currentValue !== "all"
          const isOpen = openGroup === group.paramKey
          return (
            <button
              key={group.paramKey}
              type="button"
              style={{ minHeight: "44px" }}
              onClick={() => setOpenGroup(isOpen ? null : group.paramKey)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[#005F8C] bg-[#005F8C] text-white"
                  : "border-[#dce3ea] bg-white text-[#1a2332] hover:border-[#005F8C] hover:text-[#005F8C]"
              }`}
            >
              {/* フィルターアイコン */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              <span>{group.buttonLabel}</span>
              {/* シェブロン */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* ボトムシート: PageTransition の transform 影響を受けないよう document.body に portal で描画 */}
      {mounted && openGroup !== null && activeGroup !== null && createPortal(
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpenGroup(null)}
          />

          {/* シートパネル */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] bg-white shadow-2xl">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#dce3ea]" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-base font-semibold text-[#1a2332]">
                {activeGroup.sheetTitle}
              </h3>
              <button
                type="button"
                onClick={() => setOpenGroup(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f7fa] text-[#475569] hover:bg-[#e0edf5]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* オプション一覧 */}
            <div className="px-3 pb-10">
              {activeGroup.options.map((option) => {
                const isSelected = option.key === activeGroup.currentValue
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => applyFilter(activeGroup.paramKey, option.key)}
                    style={
                      isSelected
                        ? { backgroundColor: "rgba(0,95,140,0.08)" }
                        : undefined
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm transition-colors ${
                      isSelected
                        ? "font-semibold text-[#005F8C]"
                        : "text-[#1a2332] hover:bg-[#f2f7fa]"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#005F8C"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
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
      )}
    </>
  )
}
