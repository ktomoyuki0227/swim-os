import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Users, Clock, Calendar, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { DAY_LABELS } from '@/types/database'
import { formatDate, getAge } from '@/lib/utils/date'

const LEVEL_COLORS = [
  'bg-gray-100 text-gray-700',
  'bg-blue-100 text-blue-700',
  'bg-cyan-100 text-cyan-700',
  'bg-teal-100 text-teal-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
]

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/admin/dashboard')

  const { data: cls } = await supabase
    .from('classes')
    .select(`
      *,
      profiles!coach_id(id, name, email),
      schedules(id, day_of_week, start_time, end_time, is_active),
      enrollments(
        id, enrolled_at,
        members(id, name, name_kana, birth_date, gender, current_level, status)
      )
    `)
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .single()

  if (!cls) notFound()

  const activeEnrollments = cls.enrollments?.filter(
    (e: { members: { status: string } | null }) => e.members?.status === 'active'
  ) ?? []

  const activeSchedules = cls.schedules?.filter(
    (s: { is_active: boolean }) => s.is_active
  ) ?? []

  const capacityRate = cls.capacity > 0
    ? Math.round((activeEnrollments.length / cls.capacity) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="クラス詳細" />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <Link href="/admin/schedules">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              スケジュール一覧
            </Button>
          </Link>
        </div>

        {/* Class Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: cls.color ?? '#3b82f6' }}
                />
                <div>
                  <CardTitle className="text-xl">{cls.name}</CardTitle>
                  {cls.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{cls.description}</p>
                  )}
                </div>
              </div>
              <Badge
                className="flex-shrink-0"
                variant={cls.is_active ? 'default' : 'secondary'}
              >
                {cls.is_active ? '開講中' : '休講'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">{activeEnrollments.length}</p>
                <p className="text-xs text-blue-600 mt-0.5">在籍人数</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-700">{cls.capacity}</p>
                <p className="text-xs text-gray-500 mt-0.5">定員</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-700">{capacityRate}%</p>
                <p className="text-xs text-green-600 mt-0.5">充填率</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-700">{activeSchedules.length}</p>
                <p className="text-xs text-purple-600 mt-0.5">コマ/週</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                曜日・時間
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeSchedules.length > 0 ? (
                activeSchedules.map((s: { id: string; day_of_week: number; start_time: string; end_time: string }) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 flex-shrink-0">
                      {DAY_LABELS[s.day_of_week as keyof typeof DAY_LABELS]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {s.start_time.slice(0, 5)} 〜 {s.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">スケジュール未設定</p>
              )}
            </CardContent>
          </Card>

          {/* Coach + Level Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                担当・対象レベル
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">担当コーチ</p>
                <p className="text-sm font-medium text-gray-900">
                  {(cls as { profiles: { name: string } | null }).profiles?.name ?? '未設定'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-400 mb-2">対象育成級</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[cls.level_min] ?? LEVEL_COLORS[0]}`}>
                    Lv.{cls.level_min}
                  </span>
                  <span className="text-gray-400 text-sm">〜</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[Math.min(cls.level_max, LEVEL_COLORS.length - 1)] ?? LEVEL_COLORS[0]}`}>
                    Lv.{cls.level_max}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                在籍会員 ({activeEnrollments.length}名)
              </CardTitle>
              <Link href={`/admin/members/new?class_id=${id}`}>
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  <UserPlus className="w-3.5 h-3.5" />
                  会員を追加
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="-mx-6 -mb-6">
            {activeEnrollments.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activeEnrollments.map((enrollment: {
                  id: string
                  enrolled_at: string
                  members: {
                    id: string
                    name: string
                    name_kana: string | null
                    birth_date: string | null
                    gender: string | null
                    current_level: number
                    status: string
                  } | null
                }) => {
                  const member = enrollment.members
                  if (!member) return null
                  const age = member.birth_date ? getAge(member.birth_date) : null
                  const levelColor = LEVEL_COLORS[member.current_level] ?? LEVEL_COLORS[0]

                  return (
                    <Link
                      key={enrollment.id}
                      href={`/admin/members/${member.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-400">
                            {member.name_kana && <span className="mr-2">{member.name_kana}</span>}
                            {age !== null && <span>{age}歳</span>}
                            {enrollment.enrolled_at && (
                              <span className="ml-2 text-gray-300">
                                入会 {formatDate(enrollment.enrolled_at)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${levelColor}`}>
                        Lv.{member.current_level}
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">在籍会員がいません</p>
                <Link href={`/admin/members/new?class_id=${id}`}>
                  <Button size="sm" variant="outline" className="mt-3 gap-1 text-xs">
                    <UserPlus className="w-3.5 h-3.5" />
                    最初の会員を追加
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
