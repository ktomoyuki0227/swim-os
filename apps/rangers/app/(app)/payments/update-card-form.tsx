"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { updatePaymentMethod } from "@/actions/payments"
import { useToast } from "@/components/toast"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const IS_TEST_MODE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") ?? false

const stripeInputStyle = {
  base: {
    fontSize: "15px",
    color: "#1a2332",
    fontFamily: "system-ui, sans-serif",
    "::placeholder": { color: "#8d99a8" },
  },
  invalid: { color: "#dc2626" },
}

function CardForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { showToast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false })

  const allComplete = cardComplete.number && cardComplete.expiry && cardComplete.cvc

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setSubmitting(true)
    setFormError(null)

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      setFormError("カード情報を入力してください")
      setSubmitting(false)
      return
    }

    const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardNumberElement },
    })

    if (error) {
      setFormError(error.message ?? "カード情報の確認に失敗しました")
      setSubmitting(false)
      return
    }

    if (!setupIntent?.payment_method) {
      setFormError("お支払い方法の取得に失敗しました。もう一度お試しください。")
      setSubmitting(false)
      return
    }

    const pmId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id

    const result = await updatePaymentMethod(pmId)
    if (result.error) {
      setFormError(result.error)
      setSubmitting(false)
      return
    }

    showToast("カード情報を更新しました", "success")
    onSuccess()
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">カード番号</label>
          <div className="rounded-lg border bg-white px-3 py-3">
            <CardNumberElement
              options={{ style: stripeInputStyle }}
              onChange={(e) => setCardComplete((prev) => ({ ...prev, number: e.complete }))}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">有効期限</label>
            <div className="rounded-lg border bg-white px-3 py-3">
              <CardExpiryElement
                options={{ style: stripeInputStyle }}
                onChange={(e) => setCardComplete((prev) => ({ ...prev, expiry: e.complete }))}
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">セキュリティコード</label>
            <div className="rounded-lg border bg-white px-3 py-3">
              <CardCvcElement
                options={{ style: stripeInputStyle }}
                onChange={(e) => setCardComplete((prev) => ({ ...prev, cvc: e.complete }))}
              />
            </div>
          </div>
        </div>
      </div>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {formError}
        </p>
      )}

      {IS_TEST_MODE && (
        <p className="text-xs text-muted-foreground">
          テスト用カード: 4242 4242 4242 4242 / 有効期限: 任意の将来日 / CVC: 任意の3桁
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!stripe || submitting || !allComplete}
        className="w-full"
        style={{ minHeight: "44px" }}
      >
        {submitting ? "登録中..." : "このカードで登録する"}
      </Button>
    </div>
  )
}

function CardSetupStep({ onSuccess }: { onSuccess: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!stripePromise) {
      setFetchError(true)
      setLoading(false)
      return
    }

    fetch("/api/stripe/setup-intent", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("server error")
        return res.json() as Promise<{ clientSecret?: string }>
      })
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setFetchError(true)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (fetchError || !stripePromise || !clientSecret) {
    return (
      <p className="text-sm text-destructive">
        お支払い情報の読み込みに失敗しました。ページを再読み込みしてください。
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: "ja",
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#005F8C", fontFamily: "system-ui, sans-serif" },
        },
      }}
    >
      <CardForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
      />
    </Elements>
  )
}

export function UpdateCardForm({ hasCard }: { hasCard: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button
        variant={hasCard ? "outline" : "default"}
        onClick={() => setOpen(true)}
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
          className="text-xs text-muted-foreground hover:text-foreground"
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
