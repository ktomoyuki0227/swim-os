"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">500</p>
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="text-muted-foreground">
        予期せぬエラーが発生しました。再試行してください。
      </p>
      <Button onClick={reset}>もう一度試す</Button>
    </div>
  )
}
