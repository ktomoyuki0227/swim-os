import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BookingsLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-24" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
