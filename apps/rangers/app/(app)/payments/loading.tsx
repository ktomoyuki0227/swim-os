import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>

      {/* フィルターチップ */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* 通帳明細（月ごと） */}
      <div className="space-y-5">
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="overflow-hidden rounded-[14px] border border-[#dce3ea] bg-white divide-y divide-[#f2f7fa]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-stretch">
                  <div className="w-1 shrink-0 bg-[#edf0f4]" />
                  <div className="flex flex-1 items-center gap-3 px-4 py-3">
                    <Skeleton className="h-4 w-9 shrink-0" />
                    <div className="h-8 w-px shrink-0 bg-[#edf0f4]" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-14 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
