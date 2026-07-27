"use client"

import { useSearchQueryForm } from "@/hooks/use-search-query-form"
import { SearchInputField } from "@/components/search/search-input-field"

interface TeamSearchInputProps {
  defaultValue?: string
  sort?: string
  recruitingOnly?: boolean
  days?: string[]
}

export function TeamSearchInput({
  defaultValue = "",
  sort = "newest",
  recruitingOnly = false,
  days = [],
}: TeamSearchInputProps) {
  const { inputRef, handleSubmit } = useSearchQueryForm("/search/teams", (q) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (sort !== "newest") p.set("sort", sort)
    if (recruitingOnly) p.set("recruiting", "1")
    if (days.length > 0) p.set("days", days.join(","))
    return p
  })

  return (
    <SearchInputField
      inputRef={inputRef}
      defaultValue={defaultValue}
      placeholder="チーム名で検索..."
      focusClassName="focus:border-[#0f8a4f] focus:ring-2 focus:ring-[#0f8a4f]/20"
      onSubmit={handleSubmit}
    />
  )
}
