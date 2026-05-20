import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'

export default async function ParentAttendancePage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">出席履歴</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="py-10 text-center">
          <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">出席記録がありません</p>
        </CardContent>
      </Card>
    </div>
  )
}
