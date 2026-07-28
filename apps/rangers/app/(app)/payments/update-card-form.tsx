"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Stripe.js / react-stripe-js は外部スクリプトの即時読み込みを伴うため、
// カード登録モーダルを開いたときにのみ読み込む
const CardSetupStep = dynamic(
  () => import("./stripe-card-setup").then((mod) => mod.CardSetupStep),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
)

export function UpdateCardForm({ hasCard }: { hasCard: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button
        variant={hasCard ? "outline" : "default"}
        onClick={() => setOpen(true)}
        className="w-full"
        style={{ minHeight: "44px" }}
      >
        {hasCard ? "カードを変更する" : "カードを登録する"}
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">新しいカードを登録</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#475569] hover:text-[#1a2332]"
        >
          キャンセル
        </button>
      </div>
      <CardSetupStep
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
