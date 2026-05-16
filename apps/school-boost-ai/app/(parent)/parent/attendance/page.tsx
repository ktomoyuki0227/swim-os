import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date'
import { CalendarDays } from 'lucide-react'

const STATUS_CONFIG = {
  present: { label: '出席', class: 'bg-green-100 text-green-700' },
  absent: { label: '欠席', class: 'bg-red-100 text-red-700' },
  makeup: { label: '振替', class: 'bg-blue-100 text-blue-700' },
}

export default async function ParentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: children } = await supabase
    .from('members')
    .select('id, name, current_level')
    .eq('parent_id', user.id)
    .eq('status', 'active')

  const childIds = children?.map((c) => c.id) ?? []

  const { data: records } = childIds.length > 0
    ? await supabase
        .from('attendance_records')
        .select(`
          *,
          members(id, name),
          schedules(
            start_time, end_time,
            classes(name, color)
          )
        `)
        .in('member_id', childIds)
        .order('lesson_date', { ascending: false })
        .limit(60)
    : { data: [] }

  // Group by child
  const byChild: Record<string, typeof records> = {}
  records?.forEach((r) => {
    const mid = r.member_id
    byChild[mid] = byChild[mid] ?? []
    byChild[mid].push(r)
  })

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">出席履歴</h1>

      {children?.map((child) => {
        const childRecords = byChild[child.id] ?? []
        const presentCount = childRecords.filter((r) => r.status === 'present').length
        const absentCount = childRecords.filter((r) => r.status === 'absent').length

        return (
          <Card key={child.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  {child.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-green-600 font-semibold">{presentCount}出席</span>
                  <span className="text-red-500 font-semibold">{absentCount}欠席</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-gray-50 -mx-6 -mb-6">
              {childRecords.length > 0 ? (
                childRecords.map((record) => {
                  const config = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]
                  const cls = (record.schedules as { classes: { name: string; color: string }; start_time: string; end_time: string } | null)
                  return (
                    <div key={record.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(record.lesson_date)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cls?.classes?.name} {cls?.start_time?.slice(0, 5)}〜
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.class}`}>
                        {config.label}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm px-6">
                  出席記録がありません
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
