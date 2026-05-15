"use client"

import { useState } from "react"
import { confirmBooking } from "@/actions/bookings"
import { Button } from "@/components/ui/button"

interface ConfirmBookingButtonProps {
  bookingId: string
}

export function ConfirmBookingButton({ bookingId }: ConfirmBookingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    const result = await confirmBooking(bookingId)
    if (result?.error) {
      setError(result.error)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return <span className="text-xs text-green-600 font-medium">確定済み</span>
  }

  return (
    <div>
      {error && <p className="mb-1 text-xs text-destructive">{error}</p>}
      <Button
        size="sm"
        variant="outline"
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? "処理中..." : "予約を確定"}
      </Button>
    </div>
  )
}
