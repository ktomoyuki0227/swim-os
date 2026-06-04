"use client"

import { useState, useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/actions/auth"
import type { AuthState } from "@/actions/auth"

const initialState: AuthState = { error: null }

function LoginForm() {
  const [showDevLogin, setShowDevLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, formAction, isPending] = useActionState(login, initialState)
  const searchParams = useSearchParams()
  const invite = searchParams.get("invite")

  const handleLineLogin = () => {
    // LINEログイン本実装前の検証用：新規ユーザー（チーム未所属）としてデモログイン
    setEmail("test4@example.com")
    setPassword("test1234")
    setShowDevLogin(true)
  }

  const fillAccount = (e: string) => {
    setEmail(e)
    setPassword("test1234")
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
                {invite && <input type="hidden" name="invite" value={invite} />}
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
                    placeholder="test1@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* クイック切り替え */}
                <div className="rounded-lg bg-[#f2f7fa] p-3 text-xs text-[#5c6a7a] space-y-2">
                  <p className="font-medium text-[#1a2332]">テストアカウント（パスワード共通: test1234）</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      {
                        email: "test1@example.com",
                        label: "山田 健太",
                        role: "チーム管理者",
                        desc: "セッション作成・メンバー管理・会費管理・お知らせ投稿",
                      },
                      {
                        email: "test2@example.com",
                        label: "鈴木 太郎",
                        role: "レギュラー会員",
                        desc: "セッション参加（現金）・年会費未払い状態",
                      },
                      {
                        email: "test3@example.com",
                        label: "佐藤 花子",
                        role: "回数券会員",
                        desc: "スタンプ残7回・point_card支払い・年会費支払い済み",
                      },
                      {
                        email: "test4@example.com",
                        label: "田中 新太郎",
                        role: "新規ユーザー",
                        desc: "チーム未所属・LINEログイン後の導線検証用",
                        highlight: true,
                      },
                    ].map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        onClick={() => fillAccount(a.email)}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors hover:border-[#005F8C] hover:bg-white ${
                          email === a.email
                            ? "border-[#005F8C] bg-white"
                            : a.highlight
                            ? "border-[#06C755]/40 bg-[#f0fdf4]"
                            : "border-[#dce3ea] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${a.highlight ? "text-[#166534]" : "text-[#1a2332]"}`}>
                            {a.label}
                          </p>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            a.highlight
                              ? "bg-[#06C755]/10 text-[#166534]"
                              : "bg-[#005F8C]/10 text-[#005F8C]"
                          }`}>
                            {a.role}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-[#8d99a8] leading-tight">{a.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
