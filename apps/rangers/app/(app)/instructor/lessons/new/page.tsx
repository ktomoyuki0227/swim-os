import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LessonForm } from "@/components/lesson/lesson-form"

export default function NewLessonPage() {
  return (
    <div className="mx-auto max-w-2xl">
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
