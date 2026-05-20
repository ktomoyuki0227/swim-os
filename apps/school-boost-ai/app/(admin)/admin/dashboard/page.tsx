import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ClipboardCheck, CreditCard, TrendingUp, AlertCircle, Star } from 'lucide-react'
import { currentMonth, monthLabel } from '@/lib/utils/date'
import { InviteLinkCard } from '@/components/school/invite-link-card'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function DashboardPage() {
  const supabase = createAdminClient()
  const thisMonth = currentMonth()

  const [membersRes, feesRes, todayAttendanceRes, schoolRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, status, current_level')
      .eq('school_id', SCHOOL_ID),
    supabase
      .from('monthly_fees')
      .select('status, amount')
      .eq('school_id', SCHOOL_ID)
      .eq('target_month', thisMonth),
    supabase
      .from('attendance_records')
      .select('status')
      .gte('lesson_date', new Date().toISOString().split('T')[0])
      .lte('lesson_date', new Date().toISOString().split('T')[0]),
    supabase
      .from('schools')
      .select('name, invite_code')
      .eq('id', SCHOOL_ID)
      .single(),
  ])

  const members = membersRes.data ?? []
  const fees = feesRes.data ?? []

  const activeMembers = members.filter((m) => m.status === 'active').length
  const totalMembers = members.length
  const unpaidFees = fees.filter((f) => f.status === 'unpaid')
  const unpaidAmount = unpaidFees.reduce((sum, f) => sum + f.amount, 0)
  const paidAmount = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)
  const todayPresent = todayAttendanceRes.data?.filter((a) => a.status === 'present').length ?? 0

  const stats = [
    {
      label: '在籍会員数',
      value: `${activeMembers}名`,
      sub: `全${totalMembers}名`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '今日の出席',
      value: `${todayPresent}名`,
      sub: '本日レッスン',
      icon: ClipboardCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '今月の入金',
      value: `¥${paidAmount.toLocaleString()}`,
      sub: `未収 ¥${unpaidAmount.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: '未払い件数',
      value: `${unpaidFees.length}件`,
      sub: monthLabel(thisMonth),
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  // Level distribution
  const levelCounts: Record<number, number> = {}
  members.filter(m => m.status === 'active').forEach((m) => {
    const l = m.current_level ?? 0
    levelCounts[l] = (levelCounts[l] ?? 0) + 1
  })

  const school = schoolRes.data

  return (
    <>
      <Header title="ダッシュボード" />
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            {school?.name ?? 'スクール名未設定'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                    </div>
                    <div className={`${stat.bg} p-2.5 rounded-xl`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Level distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                育成級分布
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(levelCounts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-12">{level}級</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((count / activeMembers) * 100, 100)}%` }}
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

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                クイックアクション
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/admin/members/new', label: '会員を追加', badge: null },
                { href: '/admin/attendance', label: '今日の出席を記録', badge: '要対応' },
                { href: '/admin/fees', label: '月謝状況を確認', badge: unpaidFees.length > 0 ? `${unpaidFees.length}件未払い` : null },
                { href: '/admin/grades', label: '育成級を評価', badge: null },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {action.label}
                  </span>
                  {action.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Invite link */}
        {school?.invite_code && (
          <InviteLinkCard
            inviteCode={school.invite_code}
            appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
          />
        )}
      </div>
    </>
  )
}
