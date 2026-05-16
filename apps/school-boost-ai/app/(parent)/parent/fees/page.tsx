import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'
import { monthLabel, formatDate } from '@/lib/utils/date'

const FEE_STATUS = {
  unpaid: { label: '未払い', variant: 'destructive' as const },
  paid: { label: '支払済', variant: 'default' as const },
  overdue: { label: '延滞', variant: 'secondary' as const },
}

export default async function ParentFeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: children } = await supabase
    .from('members')
    .select('id, name')
    .eq('parent_id', user.id)

  const childIds = children?.map((c) => c.id) ?? []

  const { data: fees } = childIds.length > 0
    ? await supabase
        .from('monthly_fees')
        .select('*, members(name)')
        .in('member_id', childIds)
        .order('target_month', { ascending: false })
    : { data: [] }

  const unpaidTotal = fees?.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0) ?? 0

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">月謝</h1>

      {unpaidTotal > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700">
            未払い合計: ¥{unpaidTotal.toLocaleString()}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            スクールにお問い合わせください
          </p>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            月謝一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-50 -mx-6 -mb-6">
          {fees && fees.length > 0 ? (
            fees.map((fee) => {
              const status = FEE_STATUS[fee.status as keyof typeof FEE_STATUS]
              const member = fee.members as { name: string } | null
              return (
                <div key={fee.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {monthLabel(fee.target_month)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {member?.name} / {fee.paid_at ? `支払日: ${formatDate(fee.paid_at)}` : '未払い'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      ¥{fee.amount.toLocaleString()}
                    </span>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm px-6">
              月謝データがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
