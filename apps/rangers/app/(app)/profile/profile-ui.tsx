"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PREFECTURES } from "@/types/database"

// ── プロフィールページ共通の表示・入力用コンポーネント ──────────────────
// 各セクション(基本情報・スイマー情報・緊急連絡先・登録情報・公開プロフィール)の
// カードから共通で使う小さな部品を集約する。

export function ProfileRow({ label, value, muted }: { label: string; value: string | null | undefined; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f2f7fa] py-3 last:border-0">
      <span className="min-w-[7rem] shrink-0 text-xs text-[#64748b]">{label}</span>
      <span className={value && !muted ? "text-right text-sm text-[#1a2332]" : "text-right text-sm text-[#64748b]"}>
        {value || "未設定"}
      </span>
    </div>
  )
}

export function ProfileBlockRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-[#f2f7fa] py-3 last:border-0">
      <span className="text-xs text-[#64748b]">{label}</span>
      <p className={`mt-0.5 whitespace-pre-wrap text-sm leading-relaxed ${value ? "text-[#1a2332]" : "text-[#64748b]"}`}>
        {value || "未設定"}
      </p>
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-[#005F8C]" : "bg-[#dce3ea]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export function PrivacyBadge({ type }: { type: "private" | "public" }) {
  if (type === "private") {
    return (
      <span className="flex items-center gap-1 text-xs text-[#64748b]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        管理者のみ
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-[#005F8C]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      一般公開
    </span>
  )
}

export function TagGroup({
  label,
  items,
  selected,
  onChange,
}: {
  label: string
  items: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (item: string) =>
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item])
  return (
    <div className="space-y-2">
      <Label className="text-sm text-[#475569]">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`rounded-full border px-[14px] py-[6px] text-sm transition-colors ${selected.includes(item) ? "border-transparent bg-[#005F8C] text-white" : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TagRow({ label, items, maxVisible = Infinity }: { label: string; items: string[]; maxVisible?: number }) {
  const [expanded, setExpanded] = useState(false)
  // items が変わったら展開状態をリセットする（レンダー中にstateを調整する公式パターン）
  const [prevItems, setPrevItems] = useState(items)
  if (items !== prevItems) {
    setPrevItems(items)
    setExpanded(false)
  }
  const shouldCollapse = !expanded && items.length > maxVisible
  const visible = shouldCollapse ? items.slice(0, maxVisible) : items
  const hiddenCount = Math.max(0, items.length - maxVisible)

  return (
    <div className="border-b border-[#f2f7fa] py-3 last:border-0">
      <span className="mb-1.5 block text-xs text-[#64748b]">{label}</span>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((item) => (
            <span key={item} className="rounded-full bg-[#005F8C]/10 px-[10px] py-[3px] text-xs text-[#005F8C]">{item}</span>
          ))}
          {shouldCollapse && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs text-[#005F8C] underline underline-offset-2 transition-colors hover:text-[#004E73]"
            >
              +{hiddenCount}件
            </button>
          )}
          {expanded && items.length > maxVisible && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-[#005F8C] underline underline-offset-2 transition-colors hover:text-[#004E73]"
            >
              折りたたむ
            </button>
          )}
        </div>
      ) : (
        <span className="text-sm text-[#64748b]">未設定</span>
      )}
    </div>
  )
}

export function PrefectureMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const toggle = (p: string) =>
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="space-y-1.5">
      <Label className="text-sm text-[#475569]">活動地域</Label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center justify-between rounded-[10px] border border-[#dce3ea] bg-white px-4 text-sm text-[#1a2332] hover:border-[#005F8C]/50 focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
      >
        <span className={selected.length === 0 ? "text-[#64748b]" : ""}>
          {selected.length === 0 ? "選択してください（複数可）" : `${selected.length}地域を選択中`}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`shrink-0 text-[#64748b] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((p) => (
            <span key={p} className="flex items-center gap-1 rounded-full bg-[#005F8C]/10 px-[10px] py-[3px] text-xs text-[#005F8C]">
              {p}
              <button type="button" onClick={() => toggle(p)} className="leading-none hover:text-[#c0392b]">×</button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="rounded-[10px] border border-[#dce3ea] bg-white p-3">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 sm:grid-cols-4">
            {PREFECTURES.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-1.5 rounded-[6px] px-1 py-1 text-xs hover:bg-[#f2f7fa]">
                <input
                  type="checkbox"
                  checked={selected.includes(p)}
                  onChange={() => toggle(p)}
                  className="h-3.5 w-3.5 rounded accent-[#005F8C]"
                />
                {p}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PencilButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[#64748b] transition-colors hover:bg-[#f2f7fa] hover:text-[#005F8C]"
      aria-label="編集"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  )
}

export function EditActions({
  onCancel,
  onSave,
  isPending,
}: {
  onCancel: () => void
  onSave: () => void
  isPending: boolean
}) {
  return (
    <div className="-mx-4 -mb-4 mt-4 border-t border-[#e8edf2] bg-[#f2f7fa] px-4 py-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 rounded-full border-[#dce3ea] text-[#475569]"
          onClick={onCancel}
          disabled={isPending}
        >
          キャンセル
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73] text-white"
          onClick={onSave}
          disabled={isPending}
        >
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </div>
  )
}

/** CardHeaderの「タイトル + 公開範囲バッジ + 編集ボタン/編集中ラベル」を共通化 */
export function SectionHeader({
  title,
  privacy,
  isEditingThis,
  canEdit,
  onEdit,
}: {
  title: string
  privacy: "private" | "public"
  isEditingThis: boolean
  canEdit: boolean
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base font-semibold text-[#1a2332]">{title}</span>
      <div className="flex shrink-0 items-center gap-2">
        <PrivacyBadge type={privacy} />
        {canEdit && <PencilButton onClick={onEdit} />}
        {isEditingThis && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
      </div>
    </div>
  )
}
