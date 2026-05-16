import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'

export default async function ParentGradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const { data: children } = await supabase
    .from('members')
    .select(`
      id, name, name_kana, current_level,
      grade_histories(
        id, from_level, to_level, comment, evaluated_at
      )
    `)
    .eq('parent_id', user.id)
    .eq('status', 'active')
    .order('evaluated_at', { referencedTable: 'grade_histories', ascending: false })

  // Get grade level definitions
  const { data: gradeLevels } = profile?.school_id
    ? await supabase
        .from('grade_levels')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('level')
    : { data: [] }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900 pt-2">育成級</h1>

      {children?.map((child) => {
        const currentGrade = gradeLevels?.find((g) => g.level === child.current_level)
        const nextGrade = gradeLevels?.find((g) => g.level === (child.current_level ?? 0) + 1)
        const histories = child.grade_histories as Array<{
          id: string
          from_level: number
          to_level: number
          comment: string | null
          evaluated_at: string
        }>

        return (
          <Card key={child.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{child.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {currentGrade && (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: currentGrade.badge_color }}
                    >
                      {currentGrade.level}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current level */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-500 font-medium mb-1">現在の級</p>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-xl font-bold text-blue-700">
                    {child.current_level}級
                  </span>
                  {currentGrade && (
                    <span className="text-sm text-blue-600">{currentGrade.name}</span>
                  )}
                </div>
                {currentGrade?.description && (
                  <p className="text-xs text-blue-500 mt-1">{currentGrade.description}</p>
                )}
              </div>

              {/* Next level */}
              {nextGrade && (
                <div className="border border-dashed border-gray-200 rounded-xl p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <ArrowRight className="w-3 h-3" />
                    次の目標
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {nextGrade.level}級 - {nextGrade.name}
                  </p>
                  {nextGrade.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{nextGrade.description}</p>
                  )}
                </div>
              )}

              {/* Grade history */}
              {histories && histories.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">昇級履歴</p>
                  <div className="space-y-2">
                    {histories.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 flex-shrink-0">
                          <span>{h.from_level}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span>{h.to_level}</span>
                          <span className="text-gray-400 font-normal text-xs">級</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">{formatDate(h.evaluated_at)}</p>
                          {h.comment && (
                            <p className="text-xs text-gray-600 mt-0.5">{h.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {(!children || children.length === 0) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center text-gray-400 text-sm">
            お子様の情報がありません
          </CardContent>
        </Card>
      )}
    </div>
  )
}
