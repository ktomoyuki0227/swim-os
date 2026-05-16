import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { currentMonth, monthLabel, formatDate } from '@/lib/utils/date'
import { FeeStatusToggle } from '@/components/fee/fee-status-toggle'
import { CreditCard, TrendingUp } from 'lucide-react'

const FEE_STATUS = {
  unpaid: { label: '未払い', variant: 'destructive' as const },
  paid: { label: '支払済', variant: 'default' as const },
  overdue: { label: '延滞', variant: 'secondary' as const },
}

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
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
  const targetMonth = params.month ?? currentMonth()

  const { data: fees } = await supabase
    .from('monthly_fees')
    .select(`
      *,
      members(id, name, name_kana, status)
    `)
    .eq('school_id', profile.school_id)
    .eq('target_month', targetMonth)
    .order('members(name_kana)')

  const totalAmount = fees?.reduce((sum, f) => sum + f.amount, 0) ?? 0
  const paidAmount = fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0) ?? 0
  const unpaidCount = fees?.filter(f => f.status !== 'paid').length ?? 0

  return (
    <>
      <Header title="月謝管理" />
      <div className="p-6 space-y-4">
        {/* Month selector */}
        <div className="flex items-center gap-4">
          <form>
            <input
              type="month"
              name="month"
              defaultValue={targetMonth.slice(0, 7)}
              onChange={(e) => {
                const form = e.target.form
                if (form) form.submit()
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
          <span className="text-sm font-medium text-gray-700">{monthLabel(targetMonth)}</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">請求総額</p>
              <p className="text-xl font-bold text-gray-900 mt-1">¥{totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">入金済み</p>
              <p className="text-xl font-bold text-green-600 mt-1">¥{paidAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">未払い件数</p>
              <p className="text-xl font-bold text-red-500 mt-1">{unpaidCount}件</p>
            </CardContent>
          </Card>
        </div>

        {/* Collection rate */}
        {totalAmount > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  回収率
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round((paidAmount / totalAmount) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(paidAmount / totalAmount) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee list */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              月謝一覧
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fees && fees.length > 0 ? (
              <div className="divide-y divide-gray-50">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <div className="col-span-4">会員名</div>
                  <div className="col-span-2 text-right">金額</div>
                  <div className="col-span-2">状態</div>
                  <div className="col-span-3">支払日</div>
                  <div className="col-span-1" />
                </div>
                {fees.map((fee) => {
                  const member = fee.members as { id: string; name: string; name_kana: string }
                  const status = FEE_STATUS[fee.status as keyof typeof FEE_STATUS]
                  return (
                    <div key={fee.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50">
                      <div className="col-span-4">
                        <p className="text-sm font-medium text-gray-900">{member?.name}</p>
                        {member?.name_kana && (
                          <p className="text-xs text-gray-400">{member.name_kana}</p>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ¥{fee.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="col-span-3 text-sm text-gray-400">
                        {fee.paid_at ? formatDate(fee.paid_at) : '-'}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <FeeStatusToggle feeId={fee.id} currentStatus={fee.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">
                この月の月謝データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
