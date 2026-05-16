import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { DAY_LABELS } from '@/types/database'

const DAYS = [1, 2, 3, 4, 5, 6, 0] as const // 月〜日の順

export default async function SchedulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/admin/dashboard')

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      profiles!coach_id(name),
      schedules(id, day_of_week, start_time, end_time, is_active),
      enrollments(id)
    `)
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .order('name')

  type ClassRow = NonNullable<typeof classes>[number]
  type ScheduleEntry = { class: ClassRow; schedule: NonNullable<ClassRow['schedules']>[number] }
  // Group schedules by day
  const schedulesByDay: Record<number, Array<ScheduleEntry>> = {}

  DAYS.forEach((d) => { schedulesByDay[d] = [] })

  type ScheduleRow = ScheduleEntry['schedule']
  classes?.forEach((cls) => {
    cls.schedules?.forEach((schedule: ScheduleRow) => {
      if (schedule.is_active) {
        schedulesByDay[schedule.day_of_week] = schedulesByDay[schedule.day_of_week] ?? []
        schedulesByDay[schedule.day_of_week].push({ class: cls, schedule })
      }
    })
  })

  // Sort each day by start time
  DAYS.forEach((d) => {
    schedulesByDay[d].sort((a, b) =>
      a.schedule.start_time.localeCompare(b.schedule.start_time)
    )
  })

  return (
    <>
      <Header title="スケジュール" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{classes?.length ?? 0}クラス</p>
          <Link href="/admin/schedules/new">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              クラスを追加
            </Button>
          </Link>
        </div>

        {/* Weekly timetable */}
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day) => (
            <div key={day} className="space-y-2">
              <div className={`text-center py-1.5 rounded-lg text-xs font-semibold ${
                day === new Date().getDay()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {DAY_LABELS[day as keyof typeof DAY_LABELS]}曜
              </div>
              <div className="space-y-2">
                {schedulesByDay[day].map(({ class: cls, schedule }) => {
                  const enrollmentCount = cls.enrollments?.length ?? 0
                  return (
                    <Link
                      key={schedule.id}
                      href={`/admin/schedules/${cls.id}`}
                    >
                      <div
                        className="p-2.5 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all"
                        style={{ borderColor: cls.color + '60', backgroundColor: cls.color + '15' }}
                      >
                        <p className="text-xs font-semibold text-gray-800 truncate">{cls.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {schedule.start_time.slice(0, 5)}〜{schedule.end_time.slice(0, 5)}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-gray-500">{enrollmentCount}/{cls.capacity}名</span>
                          {enrollmentCount >= cls.capacity && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">満員</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {schedulesByDay[day].length === 0 && (
                  <div className="p-3 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <p className="text-xs text-gray-300">なし</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Class list */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">クラス一覧</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-50 p-0">
            {classes?.map((cls) => (
              <Link
                key={cls.id}
                href={`/admin/schedules/${cls.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-3 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cls.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    担当: {(cls.profiles as { name: string } | null)?.name ?? '未割当'} &nbsp;/&nbsp;
                    対象: {cls.level_min}〜{cls.level_max}級 &nbsp;/&nbsp;
                    定員: {cls.capacity}名
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {cls.enrollments?.length ?? 0}名在籍
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {cls.schedules?.filter(s => s.is_active).length ?? 0}コマ/週
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
