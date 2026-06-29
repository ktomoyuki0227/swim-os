"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 開発環境のみコンソール出力（本番では外部ロギングサービスに送る）
    if (process.env.NODE_ENV === "development") {
      console.error(error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fdecea]">
        <AlertCircle className="h-10 w-10 text-[#c0392b]" aria-hidden="true" />
      </div>
      <p className="text-7xl font-bold text-[#c0392b]/20" aria-hidden="true">500</p>
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="max-w-sm text-[#5c6a7a]">
        予期せぬエラーが発生しました。再試行するか、ホームに戻ってください。
      </p>
      {error.digest && (
        <p className="text-xs text-[#5c6a7a]">
          エラーID: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          もう一度試す
        </Button>
        <Link href="/dashboard">
          <Button>ホームに戻る</Button>
        </Link>
      </div>
    </div>
  )
}
