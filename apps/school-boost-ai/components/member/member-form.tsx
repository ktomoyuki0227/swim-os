'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createMember } from '@/actions/members'
import { enrollMember } from '@/actions/classes'
import { toast } from 'sonner'

interface MemberFormProps {
  schoolId: string
  classId?: string
}

export function MemberForm({ schoolId, classId }: MemberFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState<string>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const result = await createMember(schoolId, {
      name: data.get('name') as string,
      name_kana: (data.get('name_kana') as string) || undefined,
      birth_date: (data.get('birth_date') as string) || undefined,
      gender: (gender as 'male' | 'female' | 'other') || undefined,
      emergency_contact: (data.get('emergency_contact') as string) || undefined,
      health_notes: (data.get('health_notes') as string) || undefined,
      notes: (data.get('notes') as string) || undefined,
      current_level: Number(data.get('current_level') ?? 0),
    })

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    if (classId && result?.id) {
      await enrollMember(result.id, classId)
      toast.success('会員を追加してクラスに登録しました')
      router.push(`/admin/schedules/${classId}`)
    } else {
      toast.success('会員を追加しました')
      router.push('/admin/members')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">氏名 *</Label>
              <Input id="name" name="name" placeholder="山田 太郎" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_kana">フリガナ</Label>
              <Input id="name_kana" name="name_kana" placeholder="ヤマダ タロウ" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">生年月日</Label>
              <Input id="birth_date" name="birth_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label>性別</Label>
              <Select value={gender} onValueChange={(v) => v && setGender(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_level">現在の級</Label>
            <Input
              id="current_level"
              name="current_level"
              type="number"
              min={0}
              max={99}
              defaultValue={0}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">緊急連絡先・健康情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">緊急連絡先</Label>
            <Input
              id="emergency_contact"
              name="emergency_contact"
              placeholder="保護者氏名 / 090-0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="health_notes">健康上の注意点</Label>
            <Textarea
              id="health_notes"
              name="health_notes"
              placeholder="アレルギー・持病など"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="その他メモ"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? '保存中...' : '会員を追加'}
        </Button>
      </div>
    </form>
  )
}
