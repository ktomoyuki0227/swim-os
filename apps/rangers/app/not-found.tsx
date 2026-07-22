import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Waves } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#005F8C]/[0.08]">
        <Waves className="h-10 w-10 text-[#005F8C]" aria-hidden="true" />
      </div>
      <p className="text-7xl font-bold text-[#005F8C]/20" aria-hidden="true">404</p>
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="max-w-sm text-[#475569]">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline">トップページへ</Button>
        </Link>
        <Link href="/dashboard">
          <Button>ダッシュボードへ</Button>
        </Link>
      </div>
    </div>
  )
}
