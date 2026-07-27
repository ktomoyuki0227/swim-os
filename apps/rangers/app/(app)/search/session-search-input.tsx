"use client"

import { useSearchQueryForm } from "@/hooks/use-search-query-form"
import { SearchInputField } from "@/components/search/search-input-field"
import { DEFAULT_MAX_PRICE } from "./session-price-config"

interface SessionSearchInputProps {
  defaultValue?: string
  sessionType?: string
  sort?: string
  dateRange?: string
  minPrice?: number
  maxPrice?: number
}

export function SessionSearchInput({
  defaultValue = "",
  sessionType,
  sort,
  dateRange,
  minPrice = 0,
  maxPrice = DEFAULT_MAX_PRICE,
}: SessionSearchInputProps) {
  const { inputRef, handleSubmit } = useSearchQueryForm("/search/sessions", (q) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (dateRange && dateRange !== "all") p.set("dateRange", dateRange)
    if (sessionType && sessionType !== "all") p.set("sessionType", sessionType)
    if (minPrice > 0) p.set("minPrice", String(minPrice))
    if (maxPrice !== DEFAULT_MAX_PRICE) p.set("maxPrice", String(maxPrice))
    if (sort && sort !== "date_asc") p.set("sort", sort)
    return p
  })

  return (
    <SearchInputField
      inputRef={inputRef}
      defaultValue={defaultValue}
      placeholder="場所やキーワードで検索..."
      focusClassName="focus:border-[#005F8C] focus:ring-2 focus:ring-[#005F8C]/20"
      onSubmit={handleSubmit}
    />
  )
}
