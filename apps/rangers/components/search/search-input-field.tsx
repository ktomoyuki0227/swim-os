"use client"

import type { RefObject } from "react"

interface SearchInputFieldProps {
  inputRef: RefObject<HTMLInputElement | null>
  defaultValue?: string
  placeholder: string
  /** フォーカス時のborder/ringカラー(Tailwindクラス)。呼び出し元ごとに配色が異なるため文字列で受け取る */
  focusClassName: string
  onSubmit: (e: React.FormEvent) => void
}

/** 虫眼鏡アイコン付きの検索入力欄。app/(app)/search/**配下で共通利用する */
export function SearchInputField({
  inputRef,
  defaultValue = "",
  placeholder,
  focusClassName,
  onSubmit,
}: SearchInputFieldProps) {
  return (
    <form onSubmit={onSubmit} className="flex-1">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{ minHeight: "40px" }}
          className={`w-full rounded-full border border-[#dce3ea] bg-[#f2f7fa] py-2 pl-9 pr-4 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:bg-white focus:outline-none ${focusClassName}`}
        />
      </div>
    </form>
  )
}
