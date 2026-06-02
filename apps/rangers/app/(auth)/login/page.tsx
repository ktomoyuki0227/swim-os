"use client"

import { useState, useActionState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/actions/auth"
import type { AuthState } from "@/actions/auth"

const initialState: AuthState = { error: null }

export default function LoginPage() {
  const [showDevLogin, setShowDevLogin] = useState(false)
  const [state, formAction, isPending] = useActionState(login, initialState)

  const handleLineLogin = () => {
    // TODO: 次フェーズで LINE OAuth 本実装に差し替える
    // スタブのため認証なしでの遷移は行わない
    alert("LINEログインは次フェーズで実装予定です。\nデモ用ログインをご利用ください。")
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-[#dce3ea] bg-white shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
            <Image src="/rangers-logo-背景透過.png" alt="Rangers logo" width={80} height={80} className="object-contain" />
          </div>
          <div className="flex justify-center">
            <Image src="/rangers-name-背景透過.png" alt="Rangers" width={160} height={44} className="object-contain" />
          </div>
          <p className="mt-1 text-sm text-[#5c6a7a]">マスターズ水泳チーム管理</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <button
            onClick={handleLineLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#06C755] px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#05b04c]"
            style={{ minHeight: "48px" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEでログイン（次フェーズ実装予定）
          </button>

          <p className="text-center text-xs text-[#8d99a8]">
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </p>

          {/* デモ用ログイン（開発・テスト用） */}
          <div className="border-t border-[#dce3ea] pt-4">
            <button
              type="button"
              onClick={() => setShowDevLogin((v) => !v)}
              className="w-full text-center text-xs text-[#8d99a8] hover:text-[#5c6a7a]"
            >
              {showDevLogin ? "▲ 閉じる" : "▼ デモ用ログイン（開発用）"}
            </button>

            {showDevLogin && (
              <form action={formAction} className="mt-4 space-y-3">
                {state.error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {state.error}
                  </p>
                )}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs text-[#5c6a7a]">メールアドレス</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="instructor@example.com"
                    className="h-9 border-[#dce3ea] text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs text-[#5c6a7a]">パスワード</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="test1234"
                    className="h-9 border-[#dce3ea] text-sm"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  variant="outline"
                  className="w-full rounded-full border-[#dce3ea] text-sm text-[#5c6a7a]"
                  style={{ minHeight: "44px" }}
                >
                  {isPending ? "ログイン中..." : "メールでログイン"}
                </Button>
                {process.env.NODE_ENV !== "production" && (
                  <div className="rounded-lg bg-[#f2f7fa] p-3 text-xs text-[#5c6a7a]">
                    <p className="font-medium mb-1">テストアカウント（開発環境のみ）</p>
                    <p>コーチ: instructor@example.com</p>
                    <p>スイマー: swimmer1@example.com</p>
                    <p>パスワード: test1234</p>
                  </div>
                )}
              </form>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-[#8d99a8]">
        Rangers · マスターズ水泳チーム管理
      </p>
    </div>
  )
}
