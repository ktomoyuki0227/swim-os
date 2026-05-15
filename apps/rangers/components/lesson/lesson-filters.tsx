"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function LessonFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const currentQ = searchParams.get("q") ?? ""
  const currentSort = searchParams.get("sort") ?? "date"

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="キーワードで検索（タイトル・場所）"
        defaultValue={currentQ}
        className="sm:max-w-xs"
        onChange={(e) => {
          router.replace(pathname + "?" + createQueryString("q", e.target.value))
        }}
      />
      <div className="flex gap-2">
        <Button
          variant={currentSort === "date" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            router.replace(pathname + "?" + createQueryString("sort", "date"))
          }
        >
          日付順
        </Button>
        <Button
          variant={currentSort === "price_asc" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            router.replace(pathname + "?" + createQueryString("sort", "price_asc"))
          }
        >
          料金が安い順
        </Button>
        <Button
          variant={currentSort === "price_desc" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            router.replace(pathname + "?" + createQueryString("sort", "price_desc"))
          }
        >
          料金が高い順
        </Button>
      </div>
    </div>
  )
}
