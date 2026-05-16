import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getAge } from '@/lib/utils/date'
import { DAY_LABELS } from '@/types/database'
import { MemberStatusActions } from '@/components/member/member-status-actions'
import { ArrowUp, Calendar, CreditCard } from 'lucide-react'

const STATUS_LABELS = {
  active: { label: '在籍中', variant: 'default' as const },
  suspended: { label: '休会中', variant: 'secondary' as const },
  withdrawn: { label: '退会', variant: 'destructive' as const },
}

const ATTENDANCE_LABELS = {
  present: { label: '出席', class: 'bg-green-100 text-green-700' },
  absent: { label: '欠席', class: 'bg-red-100 text-red-700' },
  makeup: { label: '振替', class: 'bg-blue-100 text-blue-700' },
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select(`
      *,
      profiles!parent_id(id, name, email, phone),
      enrollments(
        id, status, enrolled_at,
        classes(id, name, color, schedules(day_of_week, start_time, end_time))
      ),
      grade_histories(
        id, from_level, to_level, comment, evaluated_at,
        profiles!evaluated_by(name)
      ),
      attendance_records(
        id, lesson_date, status, notes,
        schedules(classes(name))
      )
    `)
    .eq('id', id)
    .order('evaluated_at', { referencedTable: 'grade_histories', ascending: false })
    .order('lesson_date', { referencedTable: 'attendance_records', ascending: false })
    .limit(10, { referencedTable: 'attendance_records' })
    .single()

  if (!member) notFound()

  const status = STATUS_LABELS[member.status as keyof typeof STATUS_LABELS]
  const age = getAge(member.birth_date)

  return (
    <>
      <Header title="会員詳細" />
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Member header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
              {member.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              {member.name_kana && (
                <p className="text-sm text-gray-400">{member.name_kana}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-sm text-blue-700 font-semibold">{member.current_level ?? 0}級</span>
              </div>
            </div>
          </div>
          <MemberStatusActions memberId={member.id} currentStatus={member.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: '生年月日', value: member.birth_date ? `${formatDate(member.birth_date)}（${age}歳）` : '-' },
                { label: '性別', value: member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : member.gender === 'other' ? 'その他' : '-' },
                { label: '緊急連絡先', value: member.emergency_contact ?? '-' },
                { label: '健康上の注意', value: member.health_notes ?? '-' },
                { label: '登録日', value: formatDate(member.created_at) },
              ].map((row) => (
                <div key={row.label} className="flex gap-3">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0">{row.label}</span>
                  <span className="text-sm text-gray-700">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Parent info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">保護者情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.profiles ? (
                [
                  { label: '氏名', value: (member.profiles as { name: string }).name },
                  { label: 'メール', value: (member.profiles as { email: string }).email ?? '-' },
                  { label: '電話', value: (member.profiles as { phone: string }).phone ?? '-' },
                ].map((row) => (
                  <div key={row.label} className="flex gap-3">
                    <span className="text-xs text-gray-400 w-28 flex-shrink-0">{row.label}</span>
                    <span className="text-sm text-gray-700">{row.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">保護者未紐づけ</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enrolled classes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              在籍クラス
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.enrollments && (member.enrollments as Array<{ id: string; classes: { name: string; color: string; schedules: Array<{ day_of_week: number; start_time: string; end_time: string }> } }>).length > 0 ? (
              <div className="space-y-2">
                {(member.enrollments as Array<{ id: string; classes: { name: string; color: string; schedules: Array<{ day_of_week: number; start_time: string; end_time: string }> } }>).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: enrollment.classes.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{enrollment.classes.name}</p>
                      <p className="text-xs text-gray-400">
                        {enrollment.classes.schedules?.map((s) =>
                          `${DAY_LABELS[s.day_of_week as keyof typeof DAY_LABELS]}曜 ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`
                        ).join(' / ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">クラス未在籍</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grade history */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-yellow-500" />
                昇級履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.grade_histories && (member.grade_histories as Array<{ id: string; from_level: number; to_level: number; comment: string; evaluated_at: string; profiles: { name: string } }>).length > 0 ? (
                <div className="space-y-2">
                  {(member.grade_histories as Array<{ id: string; from_level: number; to_level: number; comment: string; evaluated_at: string; profiles: { name: string } }>).map((h) => (
                    <div key={h.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <div className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-blue-700">
                        <span>{h.from_level}</span>
                        <span className="text-gray-400">→</span>
                        <span>{h.to_level}</span>
                        <span className="text-gray-500 font-normal">級</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">
                          {formatDate(h.evaluated_at)} / {h.profiles?.name ?? '-'}
                        </p>
                        {h.comment && <p className="text-xs text-gray-600 mt-0.5">{h.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">昇級履歴なし</p>
              )}
            </CardContent>
          </Card>

          {/* Recent attendance */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-500" />
                直近の出席
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.attendance_records && (member.attendance_records as Array<{ id: string; lesson_date: string; status: string; schedules: { classes: { name: string } } }>).length > 0 ? (
                <div className="space-y-1.5">
                  {(member.attendance_records as Array<{ id: string; lesson_date: string; status: string; schedules: { classes: { name: string } } }>).map((a) => {
                    const att = ATTENDANCE_LABELS[a.status as keyof typeof ATTENDANCE_LABELS]
                    return (
                      <div key={a.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div>
                          <p className="text-xs text-gray-500">{formatDate(a.lesson_date)}</p>
                          <p className="text-xs text-gray-400">{a.schedules?.classes?.name}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${att.class}`}>
                          {att.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">出席記録なし</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
