'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClass, addSchedule } from '@/actions/classes'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { DAY_LABELS } from '@/types/database'

interface Coach {
  id: string
  name: string
}

interface ClassFormProps {
  schoolId: string
  coaches: Coach[]
}

const CLASS_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

interface ScheduleEntry {
  day_of_week: string
  start_time: string
  end_time: string
}

export function ClassForm({ schoolId, coaches }: ClassFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coachId, setCoachId] = useState('')
  const [color, setColor] = useState(CLASS_COLORS[0])
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([
    { day_of_week: '1', start_time: '16:00', end_time: '17:00' },
  ])

  function addScheduleRow() {
    setSchedules([...schedules, { day_of_week: '1', start_time: '16:00', end_time: '17:00' }])
  }

  function removeScheduleRow(index: number) {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  function updateSchedule(index: number, field: keyof ScheduleEntry, value: string) {
    setSchedules(schedules.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const classResult = await createClass(schoolId, {
      name: data.get('name') as string,
      description: (data.get('description') as string) || undefined,
      level_min: Number(data.get('level_min') ?? 0),
      level_max: Number(data.get('level_max') ?? 99),
      capacity: Number(data.get('capacity') ?? 20),
      color,
      coach_id: coachId || undefined,
    })

    if (classResult?.error) {
      toast.error(classResult.error)
      setLoading(false)
      return
    }

    // Add schedules - need class ID, but createClass doesn't return it
    // Schedule creation will be done in class detail page
    toast.success('クラスを作成しました')
    router.push('/admin/schedules')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">クラス情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">クラス名 *</Label>
            <Input id="name" name="name" placeholder="水曜 初級クラス" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea id="description" name="description" placeholder="対象・内容などの説明" rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level_min">対象級（下限）</Label>
              <Input id="level_min" name="level_min" type="number" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level_max">対象級（上限）</Label>
              <Input id="level_max" name="level_max" type="number" min={0} defaultValue={99} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">定員</Label>
              <Input id="capacity" name="capacity" type="number" min={1} defaultValue={20} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>担当コーチ</Label>
            <Select value={coachId} onValueChange={(v) => v && setCoachId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください（任意）" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>カラー</Label>
            <div className="flex gap-2">
              {CLASS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-600 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">スケジュール（後から追加も可能）</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addScheduleRow}>
              <Plus className="w-4 h-4 mr-1" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedules.map((schedule, index) => (
            <div key={index} className="flex items-center gap-3">
              <Select
                value={schedule.day_of_week}
                onValueChange={(v) => v && updateSchedule(index, 'day_of_week', v)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([0, 1, 2, 3, 4, 5, 6] as const).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {DAY_LABELS[d]}曜
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={schedule.start_time}
                onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                className="w-32"
              />
              <span className="text-gray-400">〜</span>
              <Input
                type="time"
                value={schedule.end_time}
                onChange={(e) => updateSchedule(index, 'end_time', e.target.value)}
                className="w-32"
              />
              {schedules.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeScheduleRow(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-400">
            ※ スケジュールはクラス作成後に詳細画面から設定できます
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? '作成中...' : 'クラスを作成'}
        </Button>
      </div>
    </form>
  )
}
