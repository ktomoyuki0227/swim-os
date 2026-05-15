import { Skeleton } from "@/components/ui/skeleton"

export default function LessonsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
