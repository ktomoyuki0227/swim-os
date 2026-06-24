"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { startMonthlySubscription, cancelMonthlySubscription } from "@/actions/subscriptions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"

interface MonthlyMember {
  swimmer_id: string
  stripe_subscription_id: string | null
  subscription_status: string | null
  swimmer: { name: string | null } | null
}

interface SubscriptionSectionProps {
  teamId: string
  members: MonthlyMember[]
}

export function SubscriptionSection({ teamId, members }: SubscriptionSectionProps) {
  const router = useRouter()
  const { showToast } = useToast()

  if (members.length === 0) {
    return (
      <Card className="border-[#dce3ea]">
        <CardContent className="py-6 text-center text-sm text-[#5c6a7a]">
          月謝会員がいません
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <MemberSubscriptionCard
          key={member.swimmer_id}
          teamId={teamId}
          member={member}
          onAction={() => router.refresh()}
          showToast={showToast}
        />
      ))}
    </div>
  )
}

function MemberSubscriptionCard({
  teamId,
  member,
  onAction,
  showToast,
}: {
  teamId: string
  member: MonthlyMember
  onAction: () => void
  showToast: (msg: string, type: "success" | "error") => void
}) {
  const [isPending, startTransition] = useTransition()
  const name = member.swimmer?.name || "不明"
  const status = member.subscription_status

  const handleStart = () => {
    startTransition(async () => {
      const res = await startMonthlySubscription(teamId, member.swimmer_id)
      if (res.error) {
        showToast(res.error, "error")
      } else {
        showToast("Subscription を開始しました", "success")
        onAction()
      }
    })
  }

  const handleCancel = () => {
    if (!confirm(`${name} の月謝 Subscription をキャンセルしますか？（期間終了後に停止します）`)) return
    startTransition(async () => {
      const res = await cancelMonthlySubscription(teamId, member.swimmer_id)
      if (res.error) {
        showToast(res.error, "error")
      } else {
        showToast("Subscription をキャンセル設定しました", "success")
        onAction()
      }
    })
  }

  const statusBadge = () => {
    if (!member.stripe_subscription_id || !status || status === "canceled") {
      return <Badge className="bg-[#edf0f4] text-[#5c6a7a] border-transparent">未設定</Badge>
    }
    if (status === "active") {
      return <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent">有効</Badge>
    }
    if (status === "past_due") {
      return <Badge className="bg-[#fdf6e3] text-[#b8860b] border-transparent">支払い遅延</Badge>
    }
    if (status === "unpaid") {
      return <Badge className="bg-[#fde9e7] text-[#E8614D] border-transparent">未払い</Badge>
    }
    return <Badge className="bg-[#edf0f4] text-[#5c6a7a] border-transparent">{status}</Badge>
  }

  const canStart = !member.stripe_subscription_id || status === "canceled"
  const canCancel = !!member.stripe_subscription_id && status !== "canceled"

  return (
    <Card className="border-[#dce3ea]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
          {name[0] || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1a2332]">{name}</p>
        </div>
        {statusBadge()}
        {canStart && (
          <Button
            size="sm"
            onClick={handleStart}
            disabled={isPending}
            className="rounded-full bg-[#005F8C] hover:bg-[#004E73] text-white shrink-0"
            style={{ minHeight: "36px" }}
          >
            {isPending ? "処理中..." : "開始"}
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-full border-[#E8614D] text-[#E8614D] hover:bg-[#E8614D]/10 shrink-0"
            style={{ minHeight: "36px" }}
          >
            {isPending ? "処理中..." : "停止"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
