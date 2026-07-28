import { Skeleton } from "@/components/ui/skeleton"

export default function MessageThreadLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#dce3ea] px-4 py-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="flex-1 space-y-3 px-4 py-4">
        <Skeleton className="ml-auto h-9 w-2/5 rounded-2xl" />
        <Skeleton className="h-9 w-1/2 rounded-2xl" />
        <Skeleton className="ml-auto h-9 w-1/3 rounded-2xl" />
        <Skeleton className="h-9 w-3/5 rounded-2xl" />
      </div>

      <div className="border-t border-[#dce3ea] px-4 py-3">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  )
}
