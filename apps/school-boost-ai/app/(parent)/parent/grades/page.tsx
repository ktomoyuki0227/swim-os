import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

export default async function ParentGradesPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">育成級</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="py-10 text-center">
          <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">お子様の情報がありません</p>
        </CardContent>
      </Card>
    </div>
  )
}
