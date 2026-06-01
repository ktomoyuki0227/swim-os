"use client"

import { useState } from "react"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import type { StripeError } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/toast"

interface CheckoutFormProps {
  price: number
  onSuccess: () => void
  onCancel: () => void
}

function getStripeErrorMessage(error: StripeError): string {
  switch (error.code) {
    case "card_declined":
      return "カードが拒否されました。別のカードをお試しください。"
    case "expired_card":
      return "カードの有効期限が切れています。"
    case "incorrect_cvc":
      return "セキュリティコードが正しくありません。"
    case "insufficient_funds":
      return "残高が不足しています。"
    case "invalid_card_number":
      return "カード番号が正しくありません。"
    case "payment_intent_authentication_failure":
      return "認証に失敗しました。もう一度お試しください。"
    default:
      return error.message ?? "決済に失敗しました。もう一度お試しください。"
  }
}

export function CheckoutForm({ price, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [ready, setReady] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      showToast(getStripeErrorMessage(submitError), "error")
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings?success=true`,
      },
      redirect: "if_required",
    })

    if (confirmError) {
      showToast(getStripeErrorMessage(confirmError), "error")
      setProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ローディング中はスケルトンを表示 */}
      {!ready && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      <div className={ready ? "block" : "invisible h-0 overflow-hidden"}>
        <PaymentElement
          options={{ layout: "tabs" }}
          onReady={() => setReady(true)}
        />
      </div>

      {ready && (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={processing}
          >
            戻る
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!stripe || processing}
          >
            {processing ? "処理中..." : `${price.toLocaleString()}円 を支払う`}
          </Button>
        </div>
      )}
    </form>
  )
}
