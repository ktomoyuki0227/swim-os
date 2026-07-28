import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function SessionDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      </div>

      {/* Session Info card */}
      <Card className="border-[#dce3ea]">
        <CardContent className="divide-y divide-[#dce3ea] p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-[#dce3ea]">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-full" />
        <Skeleton className="h-12 flex-1 rounded-full" />
      </div>

      {/* Participants list */}
      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-[#dce3ea]">
              <CardContent className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
