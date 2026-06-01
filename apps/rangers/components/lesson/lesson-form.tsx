"use client"

import { useActionState, useEffect } from "react"
import { createLesson, updateLesson, type LessonActionState } from "@/actions/lessons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"
import type { Lesson } from "@/types/database"

interface LessonFormProps {
  lesson?: Lesson
}

const initialState: LessonActionState = { error: null }

// datetime-local の min 値を「現在より5分後」にする
function getMinDateTime(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000)
  // ローカルタイムでフォーマット（ISOはUTCなのでズレる）
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LessonForm({ lesson }: LessonFormProps) {
  const action = lesson
    ? updateLesson.bind(null, lesson.id)
    : createLesson

  const [state, formAction, isPending] = useActionState(action, initialState)
  const { showToast } = useToast()

  useEffect(() => {
    if (state.error) showToast(state.error, "error")
  }, [state.error])

  const defaultScheduledAt = lesson
    ? (() => {
        const d = new Date(lesson.scheduled_at)
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      })()
    : ""

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          defaultValue={lesson?.title}
          placeholder="例: 初心者向けクロール指導"
          maxLength={100}
          required
        />
        <p className="text-xs text-muted-foreground">100文字以内</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={lesson?.description}
          placeholder="レッスンの内容を記入してください"
          rows={4}
          maxLength={2000}
          required
        />
        <p className="text-xs text-muted-foreground">2000文字以内</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">料金（円）</Label>
          <Input
            id="price"
            name="price"
            type="number"
            defaultValue={lesson?.price ?? 3000}
            min={500}
            max={1000000}
            required
          />
          <p className="text-xs text-muted-foreground">最低 500円</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">定員（名）</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            defaultValue={lesson?.capacity ?? 5}
            min={1}
            max={100}
            required
          />
          <p className="text-xs text-muted-foreground">1〜100名</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">日時</Label>
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={defaultScheduledAt}
            min={getMinDateTime()}
            required
          />
          <p className="text-xs text-muted-foreground">過去の日時は選択できません</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">時間（分）</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            defaultValue={lesson?.duration_minutes ?? 60}
            min={15}
            max={240}
            step={15}
            required
          />
          <p className="text-xs text-muted-foreground">15〜240分（15分単位）</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">場所</Label>
        <Input
          id="location"
          name="location"
          defaultValue={lesson?.location}
          placeholder="例: 東京辰巳国際水泳場"
          maxLength={200}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? "保存中..."
          : lesson
            ? "レッスンを更新"
            : "レッスンを作成"}
      </Button>
    </form>
  )
}
