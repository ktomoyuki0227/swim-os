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
      <Card className="border-[#dce3ea]">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-sm text-[#5c6a7a]">現在、参加申請はありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const swimmer = req.swimmer
        const isProcessing = processingId === req.id

        return (
          <Card key={req.id} className="border-[#dce3ea]">
            <CardContent className="flex items-center gap-4 p-4">
              {/* アバター */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dce3ea]">
                {swimmer?.avatar_url ? (
                  <Image src={swimmer.avatar_url} alt={swimmer.name ?? ""} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#005F8C]">
                    {(swimmer?.name ?? "?")?.[0]}
                  </div>
                )}
              </div>

              {/* 申請者情報 */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#1a2332]">{swimmer?.name ?? "不明"}</p>
                {swimmer?.furigana && (
                  <p className="text-xs text-[#8d99a8]">{swimmer.furigana}</p>
                )}
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-[10px] font-medium text-[#005F8C]">
                    {MEMBERSHIP_TYPE_LABEL[req.membership_type] ?? req.membership_type}
                  </span>
                  <span className="text-xs text-[#8d99a8]">
                    {new Date(req.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>

              {/* 承認/拒否ボタン */}
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-[#E8614D] px-3 text-xs text-[#E8614D] hover:bg-[#fff5f4]"
                  onClick={() => handleReject(req.id)}
                  disabled={isProcessing}
                >
                  見送る
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-[#005F8C] px-3 text-xs hover:bg-[#004E73]"
                  onClick={() => handleApprove(req.id)}
                  disabled={isProcessing}
                >
                  承認
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
