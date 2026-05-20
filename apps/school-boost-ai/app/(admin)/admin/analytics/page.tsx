import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, CreditCard, Star } from 'lucide-react'
import { currentMonth, monthLabel } from '@/lib/utils/date'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function AnalyticsPage() {
  const supabase = createAdminClient()
  const thisMonth = currentMonth()

  const [membersRes, feesRes, attendanceRes, gradesRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, status, current_level, created_at')
      .eq('school_id', SCHOOL_ID),
    supabase
      .from('monthly_fees')
      .select('status, amount, target_month')
      .eq('school_id', SCHOOL_ID)
      .gte('target_month', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase
      .from('attendance_records')
      .select('status, lesson_date')
      .gte('lesson_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase
      .from('grade_histories')
      .select('to_level, evaluated_at')
      .gte('evaluated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const members = membersRes.data ?? []
  const fees = feesRes.data ?? []
  const attendance = attendanceRes.data ?? []
  const grades = gradesRes.data ?? []

  const activeMembers = members.filter((m) => m.status === 'active').length
  const suspendedMembers = members.filter((m) => m.status === 'suspended').length
  const withdrawnMembers = members.filter((m) => m.status === 'withdrawn').length

  const thisMonthFees = fees.filter((f) => f.target_month === thisMonth)
  const totalRevenue = thisMonthFees.reduce((sum, f) => sum + f.amount, 0)
  const collectedRevenue = thisMonthFees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length
  const attendanceRate = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : 0

  // Level distribution
  const levelCounts: Record<number, number> = {}
  members.filter(m => m.status === 'active').forEach((m) => {
    levelCounts[m.current_level ?? 0] = (levelCounts[m.current_level ?? 0] ?? 0) + 1
  })

  return (
    <>
      <Header title="データ分析" />
      <div className="p-6 space-y-6">
        <p className="text-sm text-gray-500">{monthLabel(thisMonth)} のデータ</p>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '在籍会員', value: `${activeMembers}名`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '今月売上', value: `¥${collectedRevenue.toLocaleString()}`, sub: `請求 ¥${totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '出席率（30日）', value: `${attendanceRate}%`, sub: `${presentCount}/${attendance.length}件`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: '今月の昇級', value: `${grades.length}件`, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          ].map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                      {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
                    </div>
                    <div className={`${card.bg} p-2.5 rounded-xl`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member status breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">会員ステータス</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: '在籍', count: activeMembers, color: 'bg-blue-500' },
                { label: '休会', count: suspendedMembers, color: 'bg-gray-400' },
                { label: '退会', count: withdrawnMembers, color: 'bg-red-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-12">{item.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${members.length > 0 ? (item.count / members.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">{item.count}名</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">合計 {members.length}名</p>
            </CardContent>
          </Card>

          {/* Level distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">育成級分布</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(levelCounts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">{level}級</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / activeMembers) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right">{count}名</span>
                  </div>
                ))}
              {Object.keys(levelCounts).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">データなし</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">出席状況（過去30日）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {[
                { label: '出席', count: presentCount, color: 'bg-green-500' },
                { label: '欠席', count: absentCount, color: 'bg-red-400' },
                { label: '振替', count: attendance.filter(a => a.status === 'makeup').length, color: 'bg-blue-400' },
              ].map((item) => (
                <div key={item.label} className="flex-1 text-center">
                  <div className={`${item.color} rounded-xl py-4 text-white mb-2`}>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs opacity-80 mt-0.5">件</p>
                  </div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
