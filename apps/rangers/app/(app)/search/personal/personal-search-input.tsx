"use client"

import { useSearchQueryForm } from "@/hooks/use-search-query-form"
import { SearchInputField } from "@/components/search/search-input-field"

interface PersonalSearchInputProps {
  defaultValue?: string
}

export function PersonalSearchInput({ defaultValue = "" }: PersonalSearchInputProps) {
  const { inputRef, handleSubmit } = useSearchQueryForm("/search/personal", (q) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
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
