import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Waves } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        <Waves className="h-10 w-10 text-blue-400" />
      </div>
      <p className="text-7xl font-bold text-blue-100">404</p>
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="max-w-sm text-muted-foreground">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link href="/dashboard">
        <Button>ダッシュボードに戻る</Button>
      </Link>
    </div>
  )
}
