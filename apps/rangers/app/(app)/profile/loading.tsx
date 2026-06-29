import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-6 px-6 pb-6">
          {/* アバター */}
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-3 w-40" />
          </div>
          {/* アカウント情報 */}
          <div className="rounded-lg bg-[#f2f7fa] px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          {/* 名前フォーム */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
