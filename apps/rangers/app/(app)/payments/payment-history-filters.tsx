"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { X, Check } from "lucide-react"
import { useMounted } from "@/hooks/use-mounted"
import { useScrollLock } from "@/hooks/use-scroll-lock"

const TYPE_OPTIONS = [
  { key: "", label: "すべて" },
  { key: "session", label: "セッション参加費" },
  { key: "fee", label: "会費" },
]

const DIRECTION_OPTIONS = [
  { key: "", label: "すべて" },
  { key: "expense", label: "支出のみ" },
  { key: "income", label: "収入のみ" },
]

const STATUS_OPTIONS = [
  { key: "", label: "すべて" },
  { key: "unpaid", label: "未払い・要対応のみ" },
]

const SORT_OPTIONS = [
  { key: "", label: "新着順" },
  { key: "asc", label: "古い順" },
]

const SORT_ICONS: Record<string, React.ReactNode> = {
  "": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  asc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
}

// ---- ボトムシート（スライドアップ） ----
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
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white sm:bottom-6 sm:mx-auto sm:max-w-md sm:rounded-[24px]"
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

function OptionGroup({
  title,
  options,
  value,
  onSelect,
}: {
  title: string
  options: { key: string; label: string }[]
  value: string
  onSelect: (key: string) => void
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#64748b]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const sel = opt.key === value
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              style={
                sel
                  ? { background: "rgba(0,95,140,0.09)", color: "#005F8C", borderColor: "rgba(0,95,140,0.25)" }
                  : { borderColor: "#e0eaef" }
              }
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                sel ? "font-semibold" : "bg-[#f8fafc] text-[#475569]"
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface PaymentHistoryFiltersProps {
  selectedType: string
  selectedSort: string
  selectedDirection: string
  selectedStatus: string
  /** 自分がいずれかのチームの管理者か（収入・ステータスの絞り込みを出すかどうか） */
  showDirectionFilter: boolean
}

export function PaymentHistoryFilters({
  selectedType,
  selectedSort,
  selectedDirection,
  selectedStatus,
  showDirectionFilter,
}: PaymentHistoryFiltersProps) {
  const router = useRouter()
  const [openSheet, setOpenSheet] = useState<"filter" | "sort" | null>(null)
  const mounted = useMounted()

  const [tempType, setTempType] = useState(selectedType)
  const [tempDirection, setTempDirection] = useState(selectedDirection)
  const [tempStatus, setTempStatus] = useState(selectedStatus)

  function openFilterSheet() {
    setTempType(selectedType)
    setTempDirection(selectedDirection)
    setTempStatus(selectedStatus)
    setOpenSheet("filter")
  }

  useScrollLock(!!openSheet)

  function navigate(type: string, direction: string, status: string, sort: string) {
    const p = new URLSearchParams()
    if (type) p.set("type", type)
    if (direction) p.set("direction", direction)
    if (status) p.set("status", status)
    if (sort) p.set("sort", sort)
    router.push(`/payments?${p.toString()}`)
  }

  function applyFilter() {
    navigate(tempType, tempDirection, tempStatus, selectedSort)
    setOpenSheet(null)
  }

  function resetFilter() {
    setTempType("")
    setTempDirection("")
    setTempStatus("")
  }

  function applySort(value: string) {
    navigate(selectedType, selectedDirection, selectedStatus, value)
    setOpenSheet(null)
  }

  const activeFilterCount =
    (selectedType !== "" ? 1 : 0) + (selectedDirection !== "" ? 1 : 0) + (selectedStatus !== "" ? 1 : 0)
  const filterActive = activeFilterCount > 0
  const sortActive = selectedSort !== ""
  const sortLabel = SORT_OPTIONS.find((o) => o.key === selectedSort)?.label ?? "並び替え"

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* 絞り込み */}
        <button
          type="button"
          onClick={() => (openSheet === "filter" ? setOpenSheet(null) : openFilterSheet())}
          style={{ minHeight: "44px" }}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            filterActive
              ? "border-[#005F8C] bg-[#005F8C] text-white"
              : "border-[#dce3ea] bg-white text-[#1a2332] hover:border-[#005F8C] hover:text-[#005F8C]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          <span>{filterActive ? `絞り込み (${activeFilterCount})` : "絞り込み"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className={`transition-transform duration-200 ${openSheet === "filter" ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* 並び替え */}
        <button
          type="button"
          onClick={() => setOpenSheet(openSheet === "sort" ? null : "sort")}
          style={{ minHeight: "44px" }}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            sortActive
              ? "border-[#005F8C] bg-[#005F8C] text-white"
              : "border-[#dce3ea] bg-white text-[#1a2332] hover:border-[#005F8C] hover:text-[#005F8C]"
          }`}
        >
          <span>{sortLabel}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className={`transition-transform duration-200 ${openSheet === "sort" ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

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
            <div className="space-y-6 px-5 pt-5 pb-6">
              <OptionGroup title="項目" options={TYPE_OPTIONS} value={tempType} onSelect={setTempType} />
              {showDirectionFilter && (
                <OptionGroup title="収支の方向" options={DIRECTION_OPTIONS} value={tempDirection} onSelect={setTempDirection} />
              )}
              {showDirectionFilter && (
                <OptionGroup title="ステータス" options={STATUS_OPTIONS} value={tempStatus} onSelect={setTempStatus} />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetFilter}
                  className="flex-1 rounded-2xl border border-[#dce3ea] py-3.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#f2f7fa]"
                >
                  リセット
                </button>
                <button
                  type="button"
                  onClick={applyFilter}
                  className="flex-[2] rounded-2xl bg-[#005F8C] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
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
                const sel = opt.key === selectedSort
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => applySort(opt.key)}
                    style={sel ? { background: "rgba(0,95,140,0.06)" } : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-4 text-sm transition-colors ${
                      sel ? "text-[#005F8C]" : "text-[#1a2332] hover:bg-[#f2f7fa]"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ background: sel ? "rgba(0,95,140,0.1)" : "#f2f7fa" }}
                    >
                      {SORT_ICONS[opt.key]}
                    </div>
                    <span className={sel ? "font-semibold" : "font-medium"}>{opt.label}</span>
                    {sel && (
                      <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#005F8C]">
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
