import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LessonForm } from "@/components/lesson/lesson-form"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "新しいレッスンを作成",
}

export default function NewLessonPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/instructor/lessons"
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        レッスン管理に戻る
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>新しいレッスンを作成</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonForm />
        </CardContent>
      </Card>
    </div>
  )
}
