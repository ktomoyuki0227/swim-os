"use client"

import Image from "next/image"
import { useState } from "react"
import { approveJoinRequest, rejectJoinRequest } from "@/actions/join-requests"
import { useToast } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const MEMBERSHIP_TYPE_LABEL: Record<string, string> = {
  annual: "年会費",
  monthly: "月謝",
  point_card: "回数券",
}

interface JoinRequest {
  id: string
  membership_type: string
  created_at: string
  swimmer: {
    id: string
    name: string
    avatar_url: string | null
    furigana: string | null
  } | null
}

interface JoinRequestsTabProps {
  teamId: string
  initialRequests: JoinRequest[]
}

export function JoinRequestsTab({ teamId, initialRequests }: JoinRequestsTabProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    const result = await approveJoinRequest(requestId)
    setProcessingId(null)

    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("参加を承認しました", "success")
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    const result = await rejectJoinRequest(requestId)
    setProcessingId(null)

    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("申請を見送りました", "success")
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 px-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <p className="text-base font-semibold text-[#1a2332]">参加申請はありません</p>
        <p className="mt-1 text-sm text-[#475569]">メンバーからの申請が届くと表示されます</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const swimmer = req.swimmer
        const isProcessing = processingId === req.id

        return (
          <Card key={req.id} className="border-[#dce3ea]">
            <CardContent className="flex items-center gap-3 p-4">
              {/* 左: アバター */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dce3ea]">
                {swimmer?.avatar_url ? (
                  <Image src={swimmer.avatar_url} alt={swimmer.name ?? ""} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#005F8C]">
                    {(swimmer?.name ?? "?")?.[0]}
                  </div>
                )}
              </div>

              {/* 中央: 名前・情報 */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1a2332]">{swimmer?.name ?? "不明"}</p>
                {swimmer?.furigana && (
                  <p className="text-xs text-[#64748b]">{swimmer.furigana}</p>
                )}
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-xs font-medium text-[#005F8C]">
                    {MEMBERSHIP_TYPE_LABEL[req.membership_type] ?? req.membership_type}
                  </span>
                  <span className="text-xs text-[#64748b]">
                    {new Date(req.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>

              {/* 右: ボタン縦並び */}
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-[#005F8C] px-4 text-xs hover:bg-[#004E73]"
                  onClick={() => handleApprove(req.id)}
                  disabled={isProcessing}
                >
                  承認
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-[#dce3ea] px-4 text-xs text-[#475569] hover:bg-[#f2f7fa]"
                  onClick={() => handleReject(req.id)}
                  disabled={isProcessing}
                >
                  見送る
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
