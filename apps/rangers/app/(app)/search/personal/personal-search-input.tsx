"use client"

import { useSearchQueryForm } from "@/hooks/use-search-query-form"
import { SearchInputField } from "@/components/search/search-input-field"

interface PersonalSearchInputProps {
  defaultValue?: string
  sort?: string
  recruitingOnly?: boolean
  days?: string[]
  prefectures?: string[]
  gender?: string
}

export function PersonalSearchInput({
  defaultValue = "",
  sort = "newest",
  recruitingOnly = false,
  days = [],
  prefectures = [],
  gender = "",
}: PersonalSearchInputProps) {
  const { inputRef, handleSubmit } = useSearchQueryForm("/search/personal", (q) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (sort !== "newest") p.set("sort", sort)
    if (!recruitingOnly) p.set("recruiting", "0")
    if (days.length > 0) p.set("days", days.join(","))
    if (prefectures.length > 0) p.set("prefecture", prefectures.join(","))
    if (gender) p.set("gender", gender)
    return p
  })

  return (
    <SearchInputField
      inputRef={inputRef}
      defaultValue={defaultValue}
      placeholder="コーチ名で検索..."
      focusClassName="focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20"
      onSubmit={handleSubmit}
    />
  )
}
