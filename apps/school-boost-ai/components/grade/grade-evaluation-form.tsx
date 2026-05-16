'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  name: string
  name_kana: string | null
  current_level: number
  status: string
}

interface GradeLevel {
  id: string
  level: number
  name: string
  badge_color: string
  description: string | null
}

interface GradeEvaluationFormProps {
  members: Member[]
  gradeLevels: GradeLevel[]
}

export function GradeEvaluationForm({ members, gradeLevels }: GradeEvaluationFormProps) {
  const router = useRouter()
  const [memberId, setMemberId] = useState('')
  const [newLevel, setNewLevel] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedMember = members.find((m) => m.id === memberId)
  const selectedLevel = gradeLevels.find((g) => g.level === Number(newLevel))
  const isPromotion = selectedMember && Number(newLevel) > selectedMember.current_level

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId || !newLevel) {
      toast.error('会員と新しい級を選択してください')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const fromLevel = selectedMember?.current_level ?? 0
    const toLevel = Number(newLevel)

    const { error } = await supabase
      .from('grade_histories')
      .insert({
        member_id: memberId,
        from_level: fromLevel,
        to_level: toLevel,
        comment: comment || null,
        evaluated_by: user?.id,
      })

    if (!error) {
      await supabase
        .from('members')
        .update({ current_level: toLevel })
        .eq('id', memberId)
    }

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(
        isPromotion
          ? `${selectedMember?.name}さんが${toLevel}級に昇級しました！`
          : `${selectedMember?.name}さんの級を${toLevel}級に更新しました`
      )
      setMemberId('')
      setNewLevel('')
      setComment('')
      router.refresh()
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ChevronUp className="w-4 h-4 text-yellow-500" />
          昇級評価
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>会員を選択</Label>
            <Select value={memberId} onValueChange={(v) => v && setMemberId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="会員を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}（現在 {m.current_level}級）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>新しい級</Label>
            <Select value={newLevel} onValueChange={(v) => v && setNewLevel(v)}>
              <SelectTrigger>
                <SelectValue placeholder="級を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((gl) => (
                  <SelectItem key={gl.id} value={String(gl.level)}>
                    {gl.level}級 - {gl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedMember && newLevel && (
            <div className={`p-3 rounded-xl border-2 ${
              isPromotion
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                {isPromotion && <Star className="w-4 h-4 text-yellow-500" />}
                <p className="text-sm font-medium">
                  {selectedMember.name}
                  <span className="text-gray-500 mx-2">
                    {selectedMember.current_level}級 → {newLevel}級
                  </span>
                  {selectedLevel?.name}
                </p>
              </div>
              {isPromotion && (
                <p className="text-xs text-yellow-700 mt-1">昇級です！</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>コメント（任意）</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="評価コメントを入力..."
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !memberId || !newLevel}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '保存中...' : '評価を保存'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
