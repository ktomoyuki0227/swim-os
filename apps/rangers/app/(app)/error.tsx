"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// app/(app) 配下でエラーが起きたときのバウンダリ。
// これが無いとルートの app/error.tsx まで伝播し、(app)/layout.tsx の
// AppShell(ヘッダー・ボトムナビ)ごとアンマウントされてナビゲーションを
// 失った状態でエラー画面に取り残されるため、この階層で受け止める。
export default function AppSegmentError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecea]">
        <AlertCircle className="h-8 w-8 text-[#c0392b]" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-[#1a2332]">エラーが発生しました</h1>
      <p className="max-w-sm text-sm text-[#475569]">
        予期せぬエラーが発生しました。再試行するか、ダッシュボードに戻ってください。
      </p>
      {error.digest && (
        <p className="text-xs text-[#475569]">
          エラーID: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          もう一度試す
        </Button>
        <Link href="/dashboard">
          <Button>ダッシュボードに戻る</Button>
        </Link>
      </div>
    </div>
  )
}
