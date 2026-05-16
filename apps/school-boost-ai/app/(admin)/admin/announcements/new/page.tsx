'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [targetType, setTargetType] = useState('all')
  const [isPublished, setIsPublished] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user!.id)
      .single()

    const { error } = await supabase
      .from('announcements')
      .insert({
        school_id: profile!.school_id,
        title: data.get('title') as string,
        body: data.get('body') as string,
        target_type: targetType,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        created_by: user!.id,
      })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(isPublished ? 'お知らせを公開しました' : '下書きとして保存しました')
      router.push('/admin/announcements')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">お知らせ作成</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" name="title" placeholder="お知らせのタイトル" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">本文 *</Label>
              <Textarea id="body" name="body" placeholder="お知らせの内容..." rows={6} required />
            </div>
            <div className="space-y-2">
              <Label>配信対象</Label>
              <Select value={targetType} onValueChange={(v) => v && setTargetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全員</SelectItem>
                  <SelectItem value="parent">保護者のみ</SelectItem>
                  <SelectItem value="class">特定クラス</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={loading}
            onClick={() => setIsPublished(false)}
          >
            下書き保存
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsPublished(true)}
          >
            {loading ? '送信中...' : '公開する'}
          </Button>
        </div>
      </form>
    </div>
  )
}
