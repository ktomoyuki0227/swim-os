"use client"

import { useState } from "react"
import { cancelBooking } from "@/actions/bookings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle } from "lucide-react"
import { useToast } from "@/components/toast"

interface CancelBookingButtonProps {
  bookingId: string
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const { showToast } = useToast()

  async function handleCancel() {
    setLoading(true)
    const result = await cancelBooking(bookingId)
    if (result?.error) {
      showToast(result.error, "error")
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
