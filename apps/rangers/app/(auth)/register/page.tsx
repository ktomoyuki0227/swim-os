"use client"

import { useActionState, Suspense, Fragment } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { register, type AuthState } from "@/actions/auth"

const initialState: AuthState = { error: null }

const ALL_STEPS = [
  { num: 1, label: "アカウント作成" },
  { num: 2, label: "自己紹介" },
  { num: 3, label: "基本情報①" },
  { num: 4, label: "基本情報②" },
  { num: 5, label: "緊急連絡先" },
  { num: 6, label: "競技登録" },
  { num: 7, label: "お支払い" },
]

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-4 flex items-center">
      {ALL_STEPS.map(({ num, label }, i) => (
        <Fragment key={num}>
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                num < current
                  ? "bg-[#005F8C]/20 text-[#005F8C]"
                  : num === current
                  ? "bg-[#005F8C] text-white shadow-md"
                  : "bg-[#dce3ea] text-[#8d99a8]"
              }`}
            >
              {num < current ? "✓" : num}
            </div>
            <p
              className={`mt-1 hidden text-[10px] sm:block ${
                num === current ? "font-medium text-[#005F8C]" : "text-[#8d99a8]"
              }`}
            >
              {label}
            </p>
          </div>
          {i < ALL_STEPS.length - 1 && (
            <div
              className={`mx-1 h-[2px] flex-1 transition-colors ${
                num < current ? "bg-[#005F8C]/30" : "bg-[#dce3ea]"
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}

function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState)
  const searchParams = useSearchParams()
  const invite = searchParams.get("invite")

  return (
    <div className="mx-auto w-full max-w-md">
      <StepProgress current={1} />

      <div className="rounded-2xl bg-white px-8 py-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-[#1a2332]">アカウント作成</h1>

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
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005F8C]/30"
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
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005F8C]/30"
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
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005F8C]/30"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" name="termsAgreed" value="on" required className="mt-0.5 accent-[#005F8C]" />
              <span className="text-muted-foreground">
                <Link href="/terms" className="text-[#005F8C] hover:underline">利用規約</Link>
                と
                <Link href="/privacy" className="text-[#005F8C] hover:underline">プライバシーポリシー</Link>
                に同意します
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full rounded-xl bg-[#005F8C] py-3 text-sm font-bold text-white transition-colors hover:bg-[#004E73] disabled:opacity-60"
          >
            {isPending ? "登録中..." : "登録"}
          </button>
        </form>

        <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方はこちら
          <br />
          <Link href="/login" className="mt-1 inline-block text-[#005F8C] font-medium hover:underline">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
