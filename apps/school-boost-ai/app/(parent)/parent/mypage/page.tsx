import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Star, CreditCard, Bell } from 'lucide-react'
import { formatDate, currentMonth, monthLabel } from '@/lib/utils/date'
import { DAY_LABELS } from '@/types/database'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function ParentMypagePage() {
  const supabase = createAdminClient()
  const thisMonth = currentMonth()

  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', SCHOOL_ID)
    .single()

  // Get announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, created_at')
    .eq('school_id', SCHOOL_ID)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm">{school?.name ?? 'スクール'}</p>
        <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="py-10 text-center text-gray-400 text-sm">
          お子様の情報がまだ登録されていません
        </CardContent>
      </Card>

      {/* Announcements preview */}
      {announcements && announcements.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              最新のお知らせ
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-50 -mx-6 -mb-6">
            {announcements.map((ann) => (
              <a
                key={ann.id}
                href="/parent/announcements"
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
              >
                <p className="text-sm text-gray-700 truncate">{ann.title}</p>
                <span className="text-xs text-gray-400 ml-3 flex-shrink-0">
                  {formatDate(ann.created_at)}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/parent/attendance"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:border-blue-200 transition-colors"
        >
          <CalendarDays className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">出席履歴</p>
        </a>
        <a
          href="/parent/grades"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:border-yellow-200 transition-colors"
        >
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">育成級</p>
        </a>
      </div>
    </div>
  )
}
