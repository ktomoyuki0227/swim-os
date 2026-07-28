import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      <div className="flex flex-col gap-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-[#dce3ea] px-4 py-3"
            style={{ borderLeft: i % 2 === 0 ? "4px solid #dce3ea" : undefined }}
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
            <Skeleton className="mt-2 h-3 w-full max-w-xs" />
          </div>
        ))}
      </div>
    </div>
  )
}
