"use client"

import { useEffect, useRef, useState } from "react"
import { Check, X } from "lucide-react"
import { PREFECTURES } from "@/types/database"

interface PrefectureMultiSelectProps {
  value: string[]
  onChange: (next: string[]) => void
  accentColor: string
  accentBg: string
}

/**
 * 都道府県の複数選択UI。
 * ドロップダウンでチェックすると、その下に選択中の都道府県がチップとして並び、
 * チップの×で個別に解除できる（team/personal 両方の絞り込みシートで共用）。
 */
export function PrefectureMultiSelect({ value, onChange, accentColor, accentBg }: PrefectureMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  function toggle(pref: string) {
    onChange(value.includes(pref) ? value.filter((p) => p !== pref) : [...value, pref])
  }

  function remove(pref: string) {
    onChange(value.filter((p) => p !== pref))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ borderColor: open ? accentColor : "#e0eaef" }}
        className="flex w-full items-center justify-between rounded-xl border bg-[#f8fafc] px-4 py-2.5 text-sm transition-colors"
      >
        <span className={value.length > 0 ? "font-medium text-[#1a2332]" : "text-[#64748b]"}>
          {value.length > 0 ? `${value.length}件選択中` : "都道府県を選択"}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 text-[#64748b] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-10 max-h-56 overflow-y-auto rounded-xl border border-[#e0eaef] bg-white p-1.5 shadow-lg">
          {PREFECTURES.map((pref) => {
            const sel = value.includes(pref)
            return (
              <button
                key={pref}
                type="button"
                onClick={() => toggle(pref)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[#f2f7fa]"
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={sel ? { background: accentColor, borderColor: accentColor } : { borderColor: "#cbd5e1" }}
                >
                  {sel && <Check className="h-3 w-3 text-white" aria-hidden="true" />}
                </span>
                <span className={sel ? "font-medium text-[#1a2332]" : "text-[#475569]"}>{pref}</span>
              </button>
            )
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {value.map((pref) => (
            <span
              key={pref}
              className="flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium"
              style={{ background: accentBg, color: accentColor }}
            >
              {pref}
              <button
                type="button"
                onClick={() => remove(pref)}
                aria-label={`${pref}を解除`}
                className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/10"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
