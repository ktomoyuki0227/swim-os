"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { createBooking } from "@/actions/bookings"
import { Button } from "@/components/ui/button"
import { CheckoutForm } from "@/components/booking/checkout-form"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
)

interface BookingButtonProps {
  lessonId: string
  price: number
  isFull: boolean
  alreadyBooked: boolean
  isMock?: boolean
}

export function BookingButton({
  lessonId,
  price,
  isFull,
  alreadyBooked,
  isMock = false,
}: BookingButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  if (isMock) {
    return (
      <Button disabled className="w-full">
        サンプルデータのため予約不可
      </Button>
    )
  }

  if (alreadyBooked) {
    return (
      <Button disabled className="w-full">
        予約済み
      </Button>
    )
  }

  if (isFull) {
    return (
      <Button disabled className="w-full">
        満員
      </Button>
    )
  }

  async function handleBooking() {
    setLoading(true)
    setError(null)

    const result = await createBooking(lessonId)

    if ("error" in result && result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if ("skipPayment" in result && result.skipPayment) {
      router.push("/bookings?success=true")
      return
    }

    if ("clientSecret" in result && result.clientSecret) {
      setClientSecret(result.clientSecret)
    }

    setLoading(false)
  }

  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              borderRadius: "8px",
            },
          },
          locale: "ja",
        }}
      >
        <CheckoutForm
          price={price}
          onSuccess={() => {
            router.push("/bookings?success=true")
          }}
          onCancel={() => setClientSecret(null)}
        />
      </Elements>
    )
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <Button onClick={handleBooking} disabled={loading} className="w-full">
        {loading
          ? "処理中..."
          : `予約する（${price.toLocaleString()}円）`}
      </Button>
    </div>
  )
}
