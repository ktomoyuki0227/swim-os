import { Skeleton } from "@/components/ui/skeleton"

export default function LessonsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 sm:w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            {/* 画像エリア */}
            <Skeleton className="h-44 w-full rounded-none" />
            {/* カード本文 */}
            <div className="space-y-2 p-4 pb-5">
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
