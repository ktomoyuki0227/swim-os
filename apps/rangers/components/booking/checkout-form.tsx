"use client"

import { useState } from "react"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"

interface CheckoutFormProps {
  price: number
  onSuccess: () => void
  onCancel: () => void
}

export function CheckoutForm({ price, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? "入力内容にエラーがあります")
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings?success=true`,
      },
    })

    if (confirmError) {
      setError(confirmError.message ?? "決済に失敗しました")
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={processing}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || processing}
        >
          {processing
            ? "処理中..."
            : `${price.toLocaleString()}円 を支払う`}
        </Button>
      </div>
    </form>
  )
}
