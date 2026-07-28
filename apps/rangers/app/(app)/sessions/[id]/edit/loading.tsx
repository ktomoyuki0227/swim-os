import { Skeleton } from "@/components/ui/skeleton"

export default function EditSessionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />

      <div className="space-y-4 rounded-lg border border-[#dce3ea] p-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Skeleton className="h-12 w-24 rounded-full" />
        <Skeleton className="h-12 w-24 rounded-full" />
      </div>
    </div>
  )
}
