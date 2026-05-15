"use client"

import { useState } from "react"
import { cancelBooking } from "@/actions/bookings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle } from "lucide-react"

interface CancelBookingButtonProps {
  bookingId: string
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  async function handleCancel() {
    setLoading(true)
    const result = await cancelBooking(bookingId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
    } else {
      setCancelled(true)
    }
  }

  if (cancelled) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        キャンセル済み
      </Badge>
    )
  }

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => setConfirming(true)}
      >
        キャンセル
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          戻る
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? "処理中..." : "キャンセルする"}
        </Button>
      </div>
    </div>
  )
}
