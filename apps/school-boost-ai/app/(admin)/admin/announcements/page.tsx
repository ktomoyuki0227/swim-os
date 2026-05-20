import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Bell, BellOff } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/date'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function AnnouncementsPage() {
  const supabase = createAdminClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles!created_by(name)
    `)
    .eq('school_id', SCHOOL_ID)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="お知らせ" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{announcements?.length ?? 0}件</p>
          <Link href="/admin/announcements/new">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              お知らせ作成
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {announcements && announcements.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {announcements.map((ann) => (
                  <div key={ann.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`mt-0.5 flex-shrink-0 ${ann.is_published ? 'text-blue-500' : 'text-gray-300'}`}>
                          {ann.is_published ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ann.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{ann.body}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400">
                              {(ann.profiles as { name: string } | null)?.name ?? '-'} &nbsp;/&nbsp;
                              {formatDate(ann.created_at)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ann.target_type === 'all' ? '全員' : ann.target_type === 'class' ? 'クラス' : '保護者'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge variant={ann.is_published ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                        {ann.is_published ? '公開中' : '下書き'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">
                お知らせがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
