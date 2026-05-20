import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default async function ParentFeesPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">月謝</h1>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            月謝一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-400 text-sm">
          月謝データがありません
        </CardContent>
      </Card>
    </div>
  )
}
