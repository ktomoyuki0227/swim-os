import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { AttendanceSheet } from '@/components/attendance/attendance-sheet'
import { Card, CardContent } from '@/components/ui/card'
import { DAY_LABELS } from '@/types/database'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; schedule_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/admin/dashboard')

  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date ?? today
  const dayOfWeek = new Date(selectedDate).getDay()

  // Get schedules for selected day
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      *,
      classes!inner(
        id, name, color, school_id,
        enrollments(
          id, status,
          members(id, name, name_kana, current_level, status)
        )
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .eq('classes.school_id', profile.school_id)

  const selectedScheduleId = params.schedule_id ?? schedules?.[0]?.id

  // Get attendance records for selected schedule + date
  const { data: attendanceRecords } = selectedScheduleId ? await supabase
    .from('attendance_records')
    .select('*')
    .eq('schedule_id', selectedScheduleId)
    .eq('lesson_date', selectedDate) : { data: [] }

  const selectedSchedule = schedules?.find((s) => s.id === selectedScheduleId)

  return (
    <>
      <Header title="出席管理" />
      <div className="p-6 space-y-4">
        {/* Date picker */}
        <div className="flex items-center gap-4">
          <form>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              onChange={(e) => {
                const form = e.target.form
                if (form) form.submit()
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedScheduleId && (
              <input type="hidden" name="schedule_id" value={selectedScheduleId} />
            )}
          </form>
          <span className="text-sm text-gray-500">
            {new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(selectedDate))}
          </span>
        </div>

        {/* Schedule tabs */}
        {schedules && schedules.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {schedules.map((schedule) => {
              const cls = schedule.classes as { name: string; color: string }
              return (
                <a
                  key={schedule.id}
                  href={`/admin/attendance?date=${selectedDate}&schedule_id=${schedule.id}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    schedule.id === selectedScheduleId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cls.name}
                  <span className="ml-1.5 text-xs opacity-70">
                    {schedule.start_time.slice(0, 5)}〜
                  </span>
                </a>
              )
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 text-sm">
                {DAY_LABELS[dayOfWeek as keyof typeof DAY_LABELS]}曜日にスケジュールが設定されていません
              </p>
            </CardContent>
          </Card>
        )}

        {/* Attendance sheet */}
        {selectedSchedule && (
          <AttendanceSheet
            schedule={selectedSchedule as Parameters<typeof AttendanceSheet>[0]['schedule']}
            lessonDate={selectedDate}
            existingRecords={attendanceRecords ?? []}
          />
        )}
      </div>
    </>
  )
}
