import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Star, CreditCard, Bell } from 'lucide-react'
import { formatDate, currentMonth, monthLabel } from '@/lib/utils/date'
import { DAY_LABELS } from '@/types/database'

export default async function ParentMypagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Get children
  const { data: children } = await supabase
    .from('members')
    .select(`
      *,
      enrollments(
        id, status,
        classes(
          id, name, color,
          schedules(day_of_week, start_time, end_time, is_active)
        )
      ),
      grade_histories(id, from_level, to_level, evaluated_at)
    `)
    .eq('parent_id', user.id)
    .eq('status', 'active')
    .order('evaluated_at', { referencedTable: 'grade_histories', ascending: false })

  const thisMonth = currentMonth()

  // Get fees for children
  const childIds = children?.map((c) => c.id) ?? []
  const { data: fees } = childIds.length > 0
    ? await supabase
        .from('monthly_fees')
        .select('*')
        .in('member_id', childIds)
        .eq('target_month', thisMonth)
    : { data: [] }

  // Get announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, created_at')
    .eq('school_id', profile.school_id ?? '')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const unpaidFees = fees?.filter((f) => f.status !== 'paid') ?? []

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm">{profile.schools?.name ?? 'スクール'}</p>
        <h1 className="text-xl font-bold text-gray-900">{profile.name}さん、こんにちは</h1>
      </div>

      {/* Alerts */}
      {unpaidFees.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-semibold text-orange-700">
              {monthLabel(thisMonth)}の月謝が未払いです（{unpaidFees.length}件）
            </p>
          </div>
          <a href="/parent/fees" className="text-xs text-orange-600 mt-1 block">
            確認する →
          </a>
        </div>
      )}

      {/* Children */}
      {children && children.length > 0 ? (
        children.map((child) => {
          const activeEnrollments = (child.enrollments as Array<{
            id: string
            status: string
            classes: {
              id: string
              name: string
              color: string
              schedules: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>
            }
          }>)?.filter((e) => e.status === 'active') ?? []

          const latestGrade = child.grade_histories?.[0]

          return (
            <Card key={child.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{child.name}</CardTitle>
                      <p className="text-xs text-gray-400">{child.name_kana}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{child.current_level}</span>
                    <span className="text-sm text-blue-600 ml-1">級</span>
                    {latestGrade && (
                      <p className="text-xs text-gray-400">
                        {latestGrade.from_level}→{latestGrade.to_level}級
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Next lessons */}
                {activeEnrollments.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      在籍クラス
                    </p>
                    <div className="space-y-2">
                      {activeEnrollments.map((enrollment) => {
                        const activeSchedules = enrollment.classes.schedules?.filter((s) => s.is_active) ?? []
                        return (
                          <div
                            key={enrollment.id}
                            className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50"
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                              style={{ backgroundColor: enrollment.classes.color }}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {enrollment.classes.name}
                              </p>
                              {activeSchedules.map((s, i) => (
                                <p key={i} className="text-xs text-gray-500">
                                  {DAY_LABELS[s.day_of_week as keyof typeof DAY_LABELS]}曜{' '}
                                  {s.start_time.slice(0, 5)}〜{s.end_time.slice(0, 5)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center text-gray-400 text-sm">
            お子様の情報がまだ登録されていません
          </CardContent>
        </Card>
      )}

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
