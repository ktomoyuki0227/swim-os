import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function ParentAnnouncementsPage() {
  const supabase = createAdminClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('school_id', SCHOOL_ID)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">お知らせ</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="divide-y divide-gray-50 -mx-6 -mb-6 p-6">
          {announcements && announcements.length > 0 ? (
            announcements.map((ann) => (
              <div key={ann.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{ann.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-2">
                      {formatDate(ann.published_at ?? ann.created_at)}
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{ann.body}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              お知らせがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
