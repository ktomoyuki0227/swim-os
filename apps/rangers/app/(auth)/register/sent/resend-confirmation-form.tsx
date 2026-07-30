"use client"

import { useActionState, useEffect, useState } from "react"
import { resendConfirmationEmail, type ResendState } from "@/actions/auth"

const COOLDOWN_SECONDS = 30

const initialState: ResendState = { error: null, success: false, requestId: 0 }

interface ResendConfirmationFormProps {
  email: string
  next: string
}

export function ResendConfirmationForm({ email, next }: ResendConfirmationFormProps) {
  const [state, formAction, isPending] = useActionState(resendConfirmationEmail, initialState)
  const [cooldown, setCooldown] = useState(0)

  // requestId は送信のたびに変わるため、2回目以降の成功でもクールダウンを確実に再起動できる
  // （state.success は一度 true になった後は true のまま変化しないため依存値にできない）
  useEffect(() => {
    if (state.requestId === 0 || !state.success) return
    setCooldown(COOLDOWN_SECONDS)
  }, [state.requestId, state.success])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  if (!email) return null

  return (
    <form action={formAction} className="mt-6 border-t pt-6 text-center">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="mb-3 text-sm text-[#c0392b]">{state.error}</p>
      )}
      {state.success && (
        <p className="mb-3 text-sm text-[#005F8C]">確認メールを再送信しました。</p>
      )}
      <button
        type="submit"
        disabled={isPending || cooldown > 0}
        className="rounded-full border border-[#dce3ea] px-5 py-2 text-sm font-medium text-[#005F8C] transition-colors hover:bg-[#f2f7fa] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: "44px" }}
      >
        {isPending
          ? "送信中..."
          : cooldown > 0
          ? `再送信できるまで ${cooldown}秒`
          : "確認メールを再送信する"}
      </button>
    </form>
  )
}
