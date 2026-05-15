"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

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
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-10 w-10 text-red-400" />
      </div>
      <p className="text-7xl font-bold text-red-100">500</p>
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="max-w-sm text-muted-foreground">
        予期せぬエラーが発生しました。再試行してください。
      </p>
      <Button onClick={reset}>もう一度試す</Button>
    </div>
  )
}
