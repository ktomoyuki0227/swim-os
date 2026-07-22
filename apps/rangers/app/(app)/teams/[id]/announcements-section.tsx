"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createAnnouncement } from "@/actions/announcements"
import { useToast } from "@/components/toast"

interface Announcement {
  id: string
  title: string
  body: string | null
  created_at: string
}

interface AnnouncementsSectionProps {
  teamId: string
  announcements: Announcement[]
}

export function AnnouncementsSection({ teamId, announcements }: AnnouncementsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await createAnnouncement(teamId, {
        title: title.trim(),
        body: body.trim() || undefined,
        target_tags: [],
      })
      if (result.error) {
        showToast(result.error, "error")
      } else {
        showToast("お知らせを配信しました", "success")
        setTitle("")
        setBody("")
        setShowForm(false)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1a2332]">お知らせ ({announcements.length})</h2>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-[#005F8C] hover:bg-[#004E73]"
          style={{ minHeight: "44px" }}
        >
          {showForm ? "閉じる" : "+ 作成"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-[#005F8C]/30 bg-[#f2f7fa]">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#475569]">タイトル *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="お知らせのタイトル"
                  maxLength={200}
                  required
                  className="w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm text-[#1a2332] focus:border-[#005F8C] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#475569]">本文（任意）</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="詳細内容を入力..."
                  rows={4}
                  maxLength={5000}
                  className="w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm text-[#1a2332] focus:border-[#005F8C] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-full border-[#dce3ea] text-sm text-[#475569]"
                  style={{ minHeight: "44px" }}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !title.trim()}
                  size="sm"
                  className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]"
                  style={{ minHeight: "44px" }}
                >
                  {isPending ? "送信中..." : "配信する"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {announcements.length === 0 && !showForm ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-[#475569]">お知らせはまだありません</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs text-[#005F8C] hover:underline"
            >
              最初のお知らせを作成する
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="border-[#dce3ea]">
              <CardContent className="p-4">
                <p className="font-medium text-[#1a2332]">{announcement.title}</p>
                {announcement.body && (
                  <p className="mt-1 text-sm text-[#475569] whitespace-pre-wrap">{announcement.body}</p>
                )}
                <p className="mt-2 text-xs text-[#64748b]">
                  {new Date(announcement.created_at).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
