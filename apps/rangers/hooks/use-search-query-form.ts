"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * 「入力 → URLSearchParams組み立て → router.push」という検索フォーム共通の
 * パターンを集約する。app/(app)/search/**配下の各検索入力コンポーネントで
 * 重複していたロジックをここに切り出した。
 */
export function useSearchQueryForm(
  basePath: string,
  buildParams: (query: string) => URLSearchParams
) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() || ""
    router.push(`${basePath}?${buildParams(q).toString()}`)
  }

  return { inputRef, handleSubmit }
}
