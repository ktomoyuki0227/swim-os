"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { X, Check } from "lucide-react"
import { MAX_PRICE, DEFAULT_MAX_PRICE, PRICE_STEP as STEP } from "./session-price-config"
import { useMounted } from "@/hooks/use-mounted"
import { useScrollLock } from "@/hooks/use-scroll-lock"

const DATE_RANGE_OPTIONS = [
  { key: "all", label: "すべて" },
  { key: "today", label: "今日" },
  { key: "this_week", label: "今週" },
  { key: "this_month", label: "今月" },
]

const SESSION_TYPE_OPTIONS = [
  { key: "all", label: "すべて", color: null },
  { key: "practice", label: "練習", color: "#005F8C" },
  { key: "camp", label: "合宿", color: "#D35400" },
  { key: "competition", label: "大会", color: "#C0392B" },
  { key: "event", label: "イベント", color: "#0f8a4f" },
  { key: "meeting", label: "ミーティング", color: "#7B5EA7" },
]

const SORT_OPTIONS = [
  { key: "date_asc", label: "日時の早い順" },
  { key: "price_asc", label: "料金の安い順" },
  { key: "price_desc", label: "料金の高い順" },
]

const SORT_LABELS: Record<string, string> = {
  date_asc: "並び替え",
  price_asc: "安い順",
  price_desc: "高い順",
}

// sort option アイコン（SVG）
const SORT_ICONS: Record<string, React.ReactNode> = {
  date_asc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  price_asc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  price_desc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
}

function getPriceLabel(minPrice: number, maxPrice: number): string {
  const isMinDefault = minPrice === 0
  const isMaxDefault = maxPrice === DEFAULT_MAX_PRICE
  if (isMinDefault && isMaxDefault) return "料金範囲"
  if (isMinDefault) return `〜¥${maxPrice.toLocaleString()}`
  if (isMaxDefault) return `¥${minPrice.toLocaleString()}〜`
  return `¥${minPrice.toLocaleString()}〜¥${maxPrice.toLocaleString()}`
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
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] bg-white"
        style={{
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -12px 48px rgba(0,0,0,0.14), 0 -1px 0 rgba(0,0,0,0.06)",
        }}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="h-[5px] w-12 rounded-full bg-[#dce3ea]" />
        </div>
        {children}
      </div>
    </>
  )
}

// ---- デュアルスライダー ----
function PriceRangeSlider({
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
}: {
  minVal: number
  maxVal: number
  onMinChange: (v: number) => void
  onMaxChange: (v: number) => void
}) {
  const minPct = (minVal / MAX_PRICE) * 100
  const maxPct = (maxVal / MAX_PRICE) * 100

  return (
    <div>
      {/* 金額表示 */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">最低金額</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#1a2332]">
            {minVal === 0 ? "¥0" : `¥${minVal.toLocaleString()}`}
          </p>
        </div>
        <div className="mb-2 h-px w-10 bg-[#dce3ea]" />
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">最高金額</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#1a2332]">
            {maxVal >= MAX_PRICE ? "¥20K+" : `¥${maxVal.toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* スライダートラック */}
      <div className="relative mx-1 h-10">
        {/* 背景トラック */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#e8eff4]" />
        {/* アクティブレンジ */}
        <div
          className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#005F8C]"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        {/* 透明 input（min） */}
        <input
          type="range" min={0} max={MAX_PRICE} step={STEP} value={minVal}
          onChange={(e) => onMinChange(Math.min(Number(e.target.value), maxVal - STEP))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: minVal >= MAX_PRICE - STEP ? 5 : 3 }}
        />
        {/* 透明 input（max） */}
        <input
          type="range" min={0} max={MAX_PRICE} step={STEP} value={maxVal}
          onChange={(e) => onMaxChange(Math.max(Number(e.target.value), minVal + STEP))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 4 }}
        />
        {/* ビジュアルサム（min） */}
        <div
          className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `${minPct}%`, boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 0 0 2px #005F8C" }}
        />
        {/* ビジュアルサム（max） */}
        <div
          className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `${maxPct}%`, boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 0 0 2px #005F8C" }}
        />
      </div>

      {/* 目盛りラベル */}
      <div className="mt-3 flex justify-between text-[10px] font-medium text-[#aab8c2]">
        <span>¥0</span>
        <span>¥5,000</span>
        <span>¥10,000</span>
        <span>¥15,000</span>
        <span>¥20,000+</span>
      </div>
    </div>
  )
}

// ---- メインコンポーネント ----
interface SessionFiltersBarProps {
  sessionType: string
  sort: string
  dateRange: string
  minPrice: number
  maxPrice: number
  q: string
}

export function SessionFiltersBar({
  sessionType,
  sort,
  dateRange,
  minPrice,
  maxPrice,
  q,
}: SessionFiltersBarProps) {
  const router = useRouter()
  const [openSheet, setOpenSheet] = useState<"filter" | "price" | "sort" | null>(null)
  const mounted = useMounted()

  const [tempDateRange, setTempDateRange] = useState(dateRange)
  const [tempSessionType, setTempSessionType] = useState(sessionType)
  const [tempMin, setTempMin] = useState(minPrice)
  const [tempMax, setTempMax] = useState(maxPrice)

  // シートを開くタイミングで一時編集用stateを現在値にリセットする（effectではなくイベント起点で行う）
  function openFilterSheet() {
    setTempDateRange(dateRange)
    setTempSessionType(sessionType)
    setOpenSheet("filter")
  }
  function openPriceSheet() {
    setTempMin(minPrice)
    setTempMax(maxPrice)
    setOpenSheet("price")
  }

  useScrollLock(!!openSheet)

  function buildBase() {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    return p
  }

  function applyFilter() {
    const p = buildBase()
    if (tempDateRange !== "all") p.set("dateRange", tempDateRange)
    if (tempSessionType !== "all") p.set("sessionType", tempSessionType)
    if (minPrice > 0) p.set("minPrice", String(minPrice))
    if (maxPrice !== DEFAULT_MAX_PRICE) p.set("maxPrice", String(maxPrice))
    if (sort !== "date_asc") p.set("sort", sort)
    router.push(`/search/sessions?${p.toString()}`)
    setOpenSheet(null)
  }

  function applyPrice() {
    const p = buildBase()
    if (dateRange !== "all") p.set("dateRange", dateRange)
    if (sessionType !== "all") p.set("sessionType", sessionType)
    if (tempMin > 0) p.set("minPrice", String(tempMin))
    if (tempMax !== DEFAULT_MAX_PRICE) p.set("maxPrice", String(tempMax))
    if (sort !== "date_asc") p.set("sort", sort)
    router.push(`/search/sessions?${p.toString()}`)
    setOpenSheet(null)
  }

  function applySort(value: string) {
    const p = buildBase()
    if (dateRange !== "all") p.set("dateRange", dateRange)
    if (sessionType !== "all") p.set("sessionType", sessionType)
    if (minPrice > 0) p.set("minPrice", String(minPrice))
    if (maxPrice !== DEFAULT_MAX_PRICE) p.set("maxPrice", String(maxPrice))
    if (value !== "date_asc") p.set("sort", value)
    router.push(`/search/sessions?${p.toString()}`)
    setOpenSheet(null)
  }

  const filterActive = sessionType !== "all" || dateRange !== "all"
  const priceActive = minPrice > 0 || maxPrice !== DEFAULT_MAX_PRICE
  const sortActive = sort !== "date_asc"

  const priceLabel = getPriceLabel(minPrice, maxPrice)
  const sortLabel = SORT_LABELS[sort] ?? "並び替え"

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
            filterActive ? "font-semibold text-[#005F8C]" : "text-[#475569]"
          }`}
        >
          <span>絞り込み</span>
          {filterActive && <span className="h-1.5 w-1.5 rounded-full bg-[#005F8C]" />}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${openSheet === "filter" ? "rotate-180" : ""}`} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
        </button>

        {/* 料金範囲 */}
        <button
          type="button"
          onClick={() => (openSheet === "price" ? setOpenSheet(null) : openPriceSheet())}
          style={{ minHeight: "44px" }}
          className={`flex flex-1 items-center justify-center gap-1 text-sm transition-colors ${
            priceActive ? "font-semibold text-[#005F8C]" : "text-[#475569]"
          }`}
        >
          <span className="truncate">{priceLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform duration-200 ${openSheet === "price" ? "rotate-180" : ""}`} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
        </button>

        {/* 並び替え */}
        <button
          type="button"
          onClick={() => setOpenSheet(openSheet === "sort" ? null : "sort")}
          style={{ minHeight: "44px" }}
          className={`flex flex-1 items-center justify-center gap-1 text-sm transition-colors ${
            sortActive ? "font-semibold text-[#005F8C]" : "text-[#475569]"
          }`}
        >
          <span>{sortLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${openSheet === "sort" ? "rotate-180" : ""}`} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      </div>

      {/* ボトムシート */}
      {mounted && openSheet && createPortal(
        <BottomSheet onClose={() => setOpenSheet(null)}>
          {/* シートヘッダー */}
          <div className="flex items-center justify-between px-5 pt-3 pb-4">
            <h3 className="text-[17px] font-bold tracking-tight text-[#1a2332]">
              {openSheet === "filter" ? "絞り込み" : openSheet === "price" ? "料金範囲" : "並び替え"}
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
              {/* 日付 */}
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#64748b]">日付</p>
              <div className="flex flex-wrap gap-2">
                {DATE_RANGE_OPTIONS.map((opt) => {
                  const sel = opt.key === tempDateRange
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTempDateRange(opt.key)}
                      style={sel ? {
                        background: "rgba(0,95,140,0.09)",
                        color: "#005F8C",
                        borderColor: "rgba(0,95,140,0.25)",
                      } : { borderColor: "#e0eaef" }}
                      className={`rounded-full border px-4 py-2 text-sm transition-all ${
                        sel ? "font-semibold" : "bg-[#f8fafc] text-[#475569]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              {/* 種別 */}
              <p className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-widest text-[#64748b]">種別</p>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_TYPE_OPTIONS.map((opt) => {
                  const sel = opt.key === tempSessionType
                  const c = opt.color
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTempSessionType(opt.key)}
                      style={sel ? {
                        background: c ? `${c}12` : "rgba(0,95,140,0.09)",
                        color: c || "#005F8C",
                        borderColor: c ? `${c}30` : "rgba(0,95,140,0.25)",
                      } : { borderColor: "#e0eaef" }}
                      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
                        sel ? "font-semibold" : "bg-[#f8fafc] text-[#475569]"
                      }`}
                    >
                      {c && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />}
                      <span>{opt.label}</span>
                      {sel && !c && <Check className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>

              {/* フッター */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setTempDateRange("all"); setTempSessionType("all") }}
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

          {/* 料金範囲シート */}
          {openSheet === "price" && (
            <div className="px-5 pt-6 pb-6">
              <PriceRangeSlider
                minVal={tempMin}
                maxVal={tempMax}
                onMinChange={setTempMin}
                onMaxChange={setTempMax}
              />
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setTempMin(0); setTempMax(DEFAULT_MAX_PRICE) }}
                  className="flex-1 rounded-2xl border border-[#dce3ea] py-3.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#f2f7fa]"
                >
                  リセット
                </button>
                <button
                  type="button"
                  onClick={applyPrice}
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
                const sel = opt.key === sort
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
