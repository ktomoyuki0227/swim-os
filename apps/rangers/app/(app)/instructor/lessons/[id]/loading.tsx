import { Skeleton } from "@/components/ui/skeleton"

export default function InstructorLessonDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 予約者一覧カード */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between p-6 pb-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2 px-6 pb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* 公開ステータス */}
      <div className="flex items-center justify-between rounded-xl border px-4 py-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      {/* 編集フォームカード */}
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-6 w-32 mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    </div>
  )
}
