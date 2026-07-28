import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function TeamPageLoading() {
  return (
    <div className="space-y-4">
      {/* トップバー */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* グループ名 + 説明 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      {/* メンバープレビューピル */}
      <Skeleton className="h-9 w-40 rounded-full" />

      {/* アクションボタン（管理者ビュー） */}
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-[14px]" />
        ))}
      </div>

      {/* セッション一覧 */}
      <div>
        <Skeleton className="mb-3 h-5 w-24" />
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-[#dce3ea]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
