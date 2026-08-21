"use client"

import { useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { register, type AuthState } from "@/actions/auth"
import { StepProgress } from "../step-progress"

const initialState: AuthState = { error: null }

function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState)
  const searchParams = useSearchParams()
  const invite = searchParams.get("invite")
  const redirectTo = searchParams.get("redirect")

  return (
    <div className="mx-auto w-full max-w-md">
      <StepProgress current={1} />

      <div className="rounded-2xl bg-white px-8 py-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-[#1a2332]">アカウント作成</h1>

        <form action={formAction} className="space-y-4">
          {invite && <input type="hidden" name="invite" value={invite} />}
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
          {state.error && (
            <p role="alert" className="rounded-[10px] bg-[#fdecea] px-4 py-3 text-sm text-[#c0392b]">
              {state.error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              お名前<span className="ml-0.5 text-[#c0392b]">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="例）田中 太郎"
              required
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005F8C]/30"
            />
            <p className="mt-1 text-xs text-[#475569]">本名で登録してください</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              メールアドレス<span className="ml-0.5 text-[#c0392b]">*</span>
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
              パスワード<span className="ml-0.5 text-[#c0392b]">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              placeholder="8文字以上"
              required
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005F8C]/30"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" name="termsAgreed" value="on" required className="mt-0.5 accent-[#005F8C]" />
              <span className="text-[#475569]">
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
            className="mt-2 w-full rounded-full bg-[#005F8C] py-3 text-base font-semibold text-white transition-colors hover:bg-[#004E73] disabled:opacity-50"
            style={{ minHeight: "48px" }}
          >
            {isPending ? "登録中..." : "登録"}
          </button>
        </form>

        <div className="mt-6 border-t pt-5 text-center text-sm text-[#475569]">
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
