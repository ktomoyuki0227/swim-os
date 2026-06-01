"use client"

import { useState } from "react"
import { confirmBooking } from "@/actions/bookings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/toast"

interface ConfirmBookingButtonProps {
  bookingId: string
}

export function ConfirmBookingButton({ bookingId }: ConfirmBookingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { showToast } = useToast()

  async function handleConfirm() {
    setLoading(true)
    const result = await confirmBooking(bookingId)
    if (result?.error) {
      showToast(result.error, "error")
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        確定済み
      </Badge>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        className="border-blue-200 text-blue-700 hover:bg-blue-50"
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? "処理中..." : "予約を確定"}
      </Button>
    </div>
  )
}
