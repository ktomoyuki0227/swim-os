import { Skeleton } from "@/components/ui/skeleton"

export default function BookingsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
