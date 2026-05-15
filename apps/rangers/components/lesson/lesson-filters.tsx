"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function LessonFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentQ = searchParams.get("q") ?? ""
  const currentSort = searchParams.get("sort") ?? "date"

  // デバウンス用: inputの表示値はローカルstateで持ち、300ms後にURLを更新する
  const [inputValue, setInputValue] = useState(currentQ)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URLのqが外部から変わった場合（ブラウザバック等）に同期
  useEffect(() => {
    setInputValue(currentQ)
  }, [currentQ])

  // アンマウント時にデバウンスタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  function handleSearchChange(value: string) {
    setInputValue(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      router.replace(pathname + "?" + createQueryString("q", value))
    }, 300)
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="キーワードで検索（タイトル・場所）"
        value={inputValue}
        className="sm:max-w-xs"
        onChange={(e) => handleSearchChange(e.target.value)}
        aria-label="レッスンをキーワードで検索"
      />
      <div className="flex gap-2">
        <Button
          variant={currentSort === "date" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            router.replace(pathname + "?" + createQueryString("sort", "date"))
          }
          aria-label="日付順でソート"
        >
          日付順
        </Button>
        <Button
          variant={currentSort === "price_asc" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            router.replace(pathname + "?" + createQueryString("sort", "price_asc"))
          }
          aria-label="料金が安い順でソート"
        >
          料金が安い順
        </Button>
        <Button
          variant={currentSort === "price_desc" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            router.replace(pathname + "?" + createQueryString("sort", "price_desc"))
          }
          aria-label="料金が高い順でソート"
        >
          料金が高い順
        </Button>
      </div>
    </div>
  )
}
