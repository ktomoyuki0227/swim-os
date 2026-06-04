"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { register, type AuthState } from "@/actions/auth"

const initialState: AuthState = { error: null }

const steps = ["アカウント作成", "メール確認", "利用開始"]

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-1">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? "bg-blue-400 text-white"
                    : active
                    ? "bg-blue-500 text-white"
                    : "border-2 border-gray-300 text-gray-400"
                }`}
              >
                {done ? "✓" : num}
              </div>
              <span className={`text-xs ${active ? "font-medium text-blue-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mb-5 mx-1 h-px w-8 ${done ? "bg-blue-400" : "bg-gray-300"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState)
  const searchParams = useSearchParams()
  const invite = searchParams.get("invite")

  return (
    <div className="w-full max-w-md">
      <StepProgress current={1} />

      <div className="rounded-2xl bg-white px-8 py-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-blue-500">アカウント作成</h1>

        <form action={formAction} className="space-y-4">
          {invite && <input type="hidden" name="invite" value={invite} />}
          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              お名前<span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="例）田中 太郎"
              required
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="mt-1 text-xs text-muted-foreground">本名で登録してください</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              メールアドレス<span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="例）mail@example.com"
              required
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              パスワード<span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              placeholder="6文字以上"
              required
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" required className="mt-0.5 accent-blue-500" />
              <span className="text-muted-foreground">
                <Link href="/terms" className="text-blue-600 hover:underline">利用規約</Link>
                と
                <Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>
                に同意します
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full rounded-xl bg-blue-500 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
          >
            {isPending ? "登録中..." : "登録"}
          </button>
        </form>

        <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方はこちら
          <br />
          <Link href="/login" className="mt-1 inline-block text-blue-500 font-medium hover:underline">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  )
}
