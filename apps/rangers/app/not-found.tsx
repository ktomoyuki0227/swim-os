import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="text-muted-foreground">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link href="/dashboard">
        <Button>ダッシュボードに戻る</Button>
      </Link>
    </div>
  )
}
