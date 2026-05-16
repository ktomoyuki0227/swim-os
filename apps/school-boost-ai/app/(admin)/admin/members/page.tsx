import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate, getAge } from '@/lib/utils/date'

const STATUS_LABELS = {
  active: { label: '在籍', variant: 'default' as const },
  suspended: { label: '休会', variant: 'secondary' as const },
  withdrawn: { label: '退会', variant: 'destructive' as const },
}

const GENDER_LABELS = { male: '男', female: '女', other: '他' }

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
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
  const q = params.q ?? ''
  const statusFilter = params.status ?? 'active'

  let query = supabase
    .from('members')
    .select('*, profiles!parent_id(name, phone)')
    .eq('school_id', profile.school_id)
    .order('name_kana')

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,name_kana.ilike.%${q}%`)
  }

  const { data: members } = await query

  return (
    <>
      <Header title="会員管理" />
      <div className="p-6 space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(['active', 'suspended', 'withdrawn', 'all'] as const).map((s) => (
              <Link
                key={s}
                href={`/admin/members?status=${s}${q ? `&q=${q}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s === 'active' ? '在籍' : s === 'suspended' ? '休会' : s === 'withdrawn' ? '退会' : 'すべて'}
              </Link>
            ))}
          </div>
          <Link href="/admin/members/new">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <UserPlus className="w-4 h-4" />
              会員追加
            </Button>
          </Link>
        </div>

        {/* Search */}
        <form className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="氏名・フリガナで検索..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input type="hidden" name="status" value={statusFilter} />
        </form>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {members && members.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <div className="col-span-3">氏名</div>
                  <div className="col-span-2">フリガナ</div>
                  <div className="col-span-1">性別</div>
                  <div className="col-span-1">年齢</div>
                  <div className="col-span-1">級</div>
                  <div className="col-span-2">状態</div>
                  <div className="col-span-2">登録日</div>
                </div>
                {members.map((member) => {
                  const status = STATUS_LABELS[member.status as keyof typeof STATUS_LABELS]
                  const age = getAge(member.birth_date)
                  return (
                    <Link
                      key={member.id}
                      href={`/admin/members/${member.id}`}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-sm truncate">{member.name}</span>
                      </div>
                      <div className="col-span-2 flex items-center text-sm text-gray-500">
                        {member.name_kana ?? '-'}
                      </div>
                      <div className="col-span-1 flex items-center text-sm text-gray-500">
                        {member.gender ? GENDER_LABELS[member.gender as keyof typeof GENDER_LABELS] : '-'}
                      </div>
                      <div className="col-span-1 flex items-center text-sm text-gray-500">
                        {age !== null ? `${age}歳` : '-'}
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className="text-sm font-semibold text-blue-700">{member.current_level ?? 0}級</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm text-gray-400">{formatDate(member.created_at)}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">会員が見つかりません</p>
                <Link href="/admin/members/new">
                  <Button variant="link" className="mt-2 text-blue-600">
                    会員を追加する
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-gray-400 text-right">
          {members?.length ?? 0}件表示
        </p>
      </div>
    </>
  )
}
