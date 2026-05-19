"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { submitReview } from "@/actions/reviews"

interface ReviewFormProps {
  bookingId: string
  instructorName: string
}

export function ReviewForm({ bookingId, instructorName }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError("評価を選んでください")
      return
    }
    setError(null)

    const fd = new FormData()
    fd.append("booking_id", bookingId)
    fd.append("rating", String(rating))
    fd.append("comment", comment)

    startTransition(async () => {
      const res = await submitReview(fd)
      if (res.error) {
        setError(res.error)
      } else {
        router.push("/bookings?reviewed=1")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6">
      {/* 星評価 */}
      <div>
        <p className="mb-3 text-sm font-medium">
          {instructorName} コーチへの評価
          <span className="ml-1 text-destructive">*</span>
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
              aria-label={`${s}点`}
            >
              <Star
                className={`h-10 w-10 transition-colors ${
                  s <= (hovered || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200 hover:text-yellow-200"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {["", "残念でした", "普通でした", "良かったです", "とても良かったです", "最高でした！"][rating]}
          </p>
        )}
      </div>

      {/* コメント */}
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="review-comment">
          コメント（任意）
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          placeholder="レッスンの感想、コーチの指導内容、上達した点などを書いてください"
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/500</p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-blue-500 hover:bg-blue-600"
          disabled={isPending || rating === 0}
        >
          {isPending ? "送信中..." : "口コミを投稿する"}
        </Button>
      </div>
    </form>
  )
}
