"use client"

import { useActionState } from "react"
import { createLesson, updateLesson, type LessonActionState } from "@/actions/lessons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Lesson } from "@/types/database"

interface LessonFormProps {
  lesson?: Lesson
}

const initialState: LessonActionState = { error: null }

export function LessonForm({ lesson }: LessonFormProps) {
  const action = lesson
    ? updateLesson.bind(null, lesson.id)
    : createLesson

  const [state, formAction, isPending] = useActionState(action, initialState)

  // scheduled_at を datetime-local 用にフォーマット
  const defaultScheduledAt = lesson
    ? new Date(lesson.scheduled_at).toISOString().slice(0, 16)
    : ""

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          defaultValue={lesson?.title}
          placeholder="例: 初心者向けクロール指導"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={lesson?.description}
          placeholder="レッスンの内容を記入してください"
          rows={4}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">料金（円）</Label>
          <Input
            id="price"
            name="price"
            type="number"
            defaultValue={lesson?.price ?? 3000}
            min={0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">定員</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            defaultValue={lesson?.capacity ?? 5}
            min={1}
            required
          />
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
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">時間（分）</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            defaultValue={lesson?.duration_minutes ?? 60}
            min={15}
            step={15}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">場所</Label>
        <Input
          id="location"
          name="location"
          defaultValue={lesson?.location}
          placeholder="例: 東京辰巳国際水泳場"
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
