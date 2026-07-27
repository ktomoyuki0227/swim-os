"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { X, Check } from "lucide-react"
import { useMounted } from "@/hooks/use-mounted"

const SORT_OPTIONS = [
  { key: "newest", label: "新着順" },
  { key: "name", label: "名前順（あいうえお）" },
]

const SORT_LABELS: Record<string, string> = {
  newest: "並び替え",
  name: "名前順",
}

const DAY_OPTIONS = ["日", "月", "火", "水", "木", "金", "土"]

// ---- ボトムシート ----
function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    el.style.transform = "translateY(100%)"
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = "translateY(0)"
      })
    })
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(10,20,30,0.35)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] bg-white"
        style={{
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -12px 48px rgba(0,0,0,0.14), 0 -1px 0 rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="h-[5px] w-12 rounded-full bg-[#dce3ea]" />
        </div>
        {children}
      </div>
    </>
  )
}

// ---- メインコンポーネント ----
interface TeamFiltersBarProps {
  sort: string
  recruitingOnly: boolean
  days: string[]
  q: string
}

export function TeamFiltersBar({ sort, recruitingOnly, days, q }: TeamFiltersBarProps) {
  const router = useRouter()
  const [openSheet, setOpenSheet] = useState<"filter" | "sort" | null>(null)
  const mounted = useMounted()

  const [tempDays, setTempDays] = useState<string[]>(days)

  // シートを開くタイミングで一時編集用stateを現在値にリセットする（effectではなくイベント起点で行う）
  function openFilterSheet() {
    setTempDays(days)
    setOpenSheet("filter")
  }

  useEffect(() => {
    document.body.style.overflow = openSheet ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [openSheet])

  function buildBase() {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    return p
  }

  function applyFilter() {
    const p = buildBase()
    if (!recruitingOnly) p.set("recruiting", "0")
    if (tempDays.length > 0) p.set("days", tempDays.join(","))
    if (sort !== "newest") p.set("sort", sort)
    router.push(`/search/teams?${p.toString()}`)
    setOpenSheet(null)
  }

  function applySort(value: string) {
    const p = buildBase()
    if (!recruitingOnly) p.set("recruiting", "0")
    if (days.length > 0) p.set("days", days.join(","))
    if (value !== "newest") p.set("sort", value)
    router.push(`/search/teams?${p.toString()}`)
    setOpenSheet(null)
  }

  function applyRecruiting(value: boolean) {
    const p = buildBase()
    if (!value) p.set("recruiting", "0")
    if (days.length > 0) p.set("days", days.join(","))
    if (sort !== "newest") p.set("sort", sort)
    router.push(`/search/teams?${p.toString()}`)
  }

  function toggleDay(day: string) {
    setTempDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const filterActive = days.length > 0
  const sortActive = sort !== "newest"

  const filterLabel = days.length > 0 ? `絞り込み (1)` : "絞り込み"

  return (
    <>
      {/* フィルター行 */}
      <div className="flex divide-x divide-[#e8eff4] rounded-b-2xl border-t border-[#e8eff4]">
        {/* 絞り込み */}
        <button
          type="button"
          onClick={() => (openSheet === "filter" ? setOpenSheet(null) : openFilterSheet())}
          style={{ minHeight: "44px" }}
          className={`flex flex-1 items-center justify-center gap-1 text-sm transition-colors ${
            filterActive ? "font-semibold text-[#0f8a4f]" : "text-[#475569]"
          }`}
        >
          <span>{filterLabel}</span>
          {filterActive && <span className="h-1.5 w-1.5 rounded-full bg-[#0f8a4f]" />}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${openSheet === "filter" ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* 並び替え */}
        <button
          type="button"
          onClick={() => setOpenSheet(openSheet === "sort" ? null : "sort")}
          style={{ minHeight: "44px" }}
          className={`flex flex-1 items-center justify-center gap-1 text-sm transition-colors ${
            sortActive ? "font-semibold text-[#0f8a4f]" : "text-[#475569]"
          }`}
        >
          <span>{SORT_LABELS[sort] ?? "並び替え"}</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${openSheet === "sort" ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* 募集中トグルボタン */}
        <button
          type="button"
          onClick={() => applyRecruiting(!recruitingOnly)}
          style={{ minHeight: "44px" }}
          className="flex flex-1 items-center justify-center gap-1.5"
        >
          <span className={`text-sm transition-colors ${recruitingOnly ? "font-semibold text-[#0f8a4f]" : "text-[#475569]"}`}>
            募集中
          </span>
          <div className={`relative h-5 w-9 rounded-full transition-colors ${recruitingOnly ? "bg-[#0f8a4f]" : "bg-[#dce3ea]"}`}>
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${recruitingOnly ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>

      {/* ボトムシート */}
      {mounted && openSheet && createPortal(
        <BottomSheet onClose={() => setOpenSheet(null)}>
          {/* シートヘッダー */}
          <div className="flex items-center justify-between px-5 pt-3 pb-4">
            <h3 className="text-[17px] font-bold tracking-tight text-[#1a2332]">
              {openSheet === "filter" ? "絞り込み" : "並び替え"}
            </h3>
            <button
              type="button"
              onClick={() => setOpenSheet(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f7fa] text-[#475569] transition-colors hover:bg-[#e0edf5]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mx-5 h-px bg-[#f0f4f7]" />

          {/* 絞り込みシート */}
          {openSheet === "filter" && (
            <div className="px-5 pt-5 pb-6">
              {/* 曜日 */}
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#64748b]">曜日</p>
              <div className="flex gap-2">
                {DAY_OPTIONS.map((day) => {
                  const sel = tempDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={
                        sel
                          ? { background: "rgba(15,138,79,0.09)", color: "#0f8a4f", borderColor: "rgba(15,138,79,0.25)" }
                          : { borderColor: "#e0eaef" }
                      }
                      className={`flex h-10 flex-1 items-center justify-center rounded-full border text-sm transition-all ${
                        sel ? "font-semibold" : "bg-[#f8fafc] text-[#475569]"
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* フッター */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTempDays([])}
                  className="flex-1 rounded-2xl border border-[#dce3ea] py-3.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#f2f7fa]"
                >
                  リセット
                </button>
                <button
                  type="button"
                  onClick={applyFilter}
                  className="flex-[2] rounded-2xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                  style={{ background: "#0f8a4f" }}
                >
                  適用する
                </button>
              </div>
            </div>
          )}

          {/* 並び替えシート */}
          {openSheet === "sort" && (
            <div className="px-3 pt-2 pb-8">
              {SORT_OPTIONS.map((opt) => {
                const sel = opt.key === sort
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => applySort(opt.key)}
                    style={sel ? { background: "rgba(15,138,79,0.06)" } : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-4 text-sm transition-colors ${
                      sel ? "text-[#0f8a4f]" : "text-[#1a2332] hover:bg-[#f2f7fa]"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ background: sel ? "rgba(15,138,79,0.1)" : "#f2f7fa" }}
                    >
                      {opt.key === "newest" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="12" x2="15" y2="12" />
                          <line x1="3" y1="18" x2="9" y2="18" />
                        </svg>
                      )}
                    </div>
                    <span className={sel ? "font-semibold" : "font-medium"}>{opt.label}</span>
                    {sel && (
                      <div
                        className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "#0f8a4f" }}
                      >
                        <Check className="h-3 w-3 text-white" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </BottomSheet>,
        document.body
      )}
    </>
  )
}
