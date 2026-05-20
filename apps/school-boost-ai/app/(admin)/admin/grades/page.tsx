import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp } from 'lucide-react'
import { GradeEvaluationForm } from '@/components/grade/grade-evaluation-form'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function GradesPage() {
  const supabase = createAdminClient()

  const [gradeLevelsRes, membersRes] = await Promise.all([
    supabase
      .from('grade_levels')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('level'),
    supabase
      .from('members')
      .select('id, name, name_kana, current_level, status')
      .eq('school_id', SCHOOL_ID)
      .eq('status', 'active')
      .order('current_level'),
  ])

  const gradeLevels = gradeLevelsRes.data ?? []
  const members = membersRes.data ?? []

  // Count members per level
  const membersByLevel: Record<number, typeof members> = {}
  members.forEach((m) => {
    const l = m.current_level ?? 0
    membersByLevel[l] = membersByLevel[l] ?? []
    membersByLevel[l].push(m)
  })

  return (
    <>
      <Header title="育成級管理" />
      <div className="p-6 space-y-6">
        {/* Grade levels overview */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              育成級一覧
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradeLevels.map((gl) => {
                const count = membersByLevel[gl.level]?.length ?? 0
                const maxCount = Math.max(...Object.values(membersByLevel).map((m) => m.length), 1)
                return (
                  <div key={gl.id} className="flex items-center gap-4">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: gl.badge_color }}
                    >
                      {gl.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{gl.name}</span>
                        <span className="text-xs text-gray-500">{count}名</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            backgroundColor: gl.badge_color,
                          }}
                        />
                      </div>
                      {gl.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{gl.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Member grade list + evaluation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                会員の現在の級
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-50 -mx-6 -mb-6">
              {members.map((member) => {
                const gl = gradeLevels.find((g) => g.level === member.current_level)
                return (
                  <div key={member.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        {member.name_kana && (
                          <p className="text-xs text-gray-400">{member.name_kana}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gl ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold"
                          style={{ color: gl.badge_color, borderColor: gl.badge_color + '60' }}
                        >
                          {gl.level}級 {gl.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {member.current_level}級
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
              {members.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm px-6">
                  在籍中の会員がいません
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grade evaluation */}
          <GradeEvaluationForm
            members={members}
            gradeLevels={gradeLevels}
          />
        </div>
      </div>
    </>
  )
}
