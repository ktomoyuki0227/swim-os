import { Skeleton } from "@/components/ui/skeleton"

export default function LessonDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-xl border">
        {/* 画像エリア */}
        <Skeleton className="h-64 w-full rounded-none" />
        {/* 本文 */}
        <div className="space-y-4 p-6">
          {/* 日時・時間・場所・空き の2×2グリッド */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          {/* 指導員 */}
          <div className="flex items-start gap-2">
            <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          {/* 予約ボタン */}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
