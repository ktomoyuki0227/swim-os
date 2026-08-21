"use client"

import { useState, useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/actions/auth"
import type { AuthState } from "@/actions/auth"

const initialState: AuthState = { error: null }

// テスト・デモ環境でのみ表示するクイックログイン一覧。
// 実在するテストアカウント一覧をワンクリックで入力できてしまうため、
// 本番ビルド(NODE_ENV=production)では常に非表示にする。
// Vercel・next dev いずれもNODE_ENVは環境変数で手動管理する必要がなく自動設定されるため、
// 設定漏れで本番に表示され続ける事故を防げる。
const isDemoLoginEnabled = process.env.NODE_ENV !== "production"

const DEMO_ACCOUNTS = [
  {
    email: "test1@example.com",
    label: "山田 健太",
    role: "マウントリバー 管理者",
    desc: "マウントリバー水泳クラブのグループ管理者。セッション作成・メンバー管理・会費管理。東京マスターズのメンバーでもある。",
  },
  {
    email: "test2@example.com",
    label: "鈴木 太郎",
    role: "東京マスターズ 管理者",
    desc: "東京マスターズ水泳クラブのグループ管理者。マウントリバーのレギュラー会員（現金払い）でもある。年会費未払い。",
  },
  {
    email: "test3@example.com",
    label: "佐藤 花子",
    role: "回数券会員",
    desc: "両グループのメンバー。スタンプ残7回・point_card支払い・年会費支払い済み。",
  },
  {
    email: "test4@example.com",
    label: "田中 新太郎",
    role: "新規ユーザー",
    desc: "グループ未所属。オンボーディング導線を確認したいときに使用。",
    highlight: true,
  },
]
const DEMO_ACCOUNT_PASSWORD = "Delta-coach8820!"

function LoginForm() {
  const [showDemoAccounts, setShowDemoAccounts] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, formAction, isPending] = useActionState(login, initialState)
  const searchParams = useSearchParams()
  const invite = searchParams.get("invite")
  const redirectTo = searchParams.get("redirect")
  const confirmationFailed = searchParams.get("error") === "auth"

  const fillAccount = (e: string) => {
    setEmail(e)
    setPassword(DEMO_ACCOUNT_PASSWORD)
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-[#dce3ea] bg-white shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
            <Image src="/rangers-logo-背景透過.png" alt="Rangers logo" width={80} height={80} className="object-contain" priority />
          </div>
          <div className="flex justify-center">
            <Image src="/rangers-name-背景透過.png" alt="Rangers" width={132} height={44} className="object-contain" priority />
          </div>
          <p className="mt-1 text-sm text-[#475569]">マスターズ水泳グループ管理</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {confirmationFailed && (
            <p role="alert" className="rounded-[10px] border border-[#c0392b]/20 bg-[#fdecea] px-3 py-2.5 text-xs text-[#c0392b]">
              確認リンクの有効期限が切れているか、既に使用されています。
              <Link href="/register" className="ml-1 font-medium underline">
                もう一度登録して確認メールを受け取る
              </Link>
            </p>
          )}
          <form action={formAction} className="space-y-3">
            {invite && <input type="hidden" name="invite" value={invite} />}
            {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
            {state.error && (
              <p role="alert" className="rounded-[10px] border border-[#c0392b]/20 bg-[#fdecea] px-3 py-2 text-xs text-[#c0392b]">
                {state.error}
              </p>
            )}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs text-[#475569]">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#dce3ea]"
                required
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-[#475569]">パスワード</Label>
                <Link href="/forgot-password" className="text-xs text-[#005F8C] hover:underline">
                  パスワードをお忘れですか？
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#dce3ea]"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-[#005F8C] text-white hover:bg-[#004E73]"
              style={{ minHeight: "48px" }}
            >
              {isPending ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <p className="text-center text-xs text-[#64748b]">
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </p>

          <p className="text-center text-sm text-[#475569]">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="font-medium text-[#005F8C] hover:underline">
              新規登録
            </Link>
          </p>

          {/* デモ用クイックログイン（開発・テスト用。NODE_ENV !== "production" のデプロイのみ表示、本番ビルドでは非表示） */}
          {isDemoLoginEnabled && (
            <div className="border-t border-[#dce3ea] pt-4">
              <button
                type="button"
                onClick={() => setShowDemoAccounts((v) => !v)}
                className="w-full text-center text-xs text-[#64748b] hover:text-[#475569]"
              >
                {showDemoAccounts ? "▲ 閉じる" : "▼ デモ用クイックログイン（開発用）"}
              </button>

              {showDemoAccounts && (
                <div className="mt-4 rounded-lg bg-[#f2f7fa] p-3 text-xs text-[#475569] space-y-2">
                  <p className="font-medium text-[#1a2332]">
                    テストアカウント（パスワード共通: {DEMO_ACCOUNT_PASSWORD}）
                  </p>
                  <p className="text-[#64748b]">タップすると上のフォームに自動入力されます。「ログイン」を押して進んでください。</p>
                  <div className="flex flex-col gap-1.5">
                    {DEMO_ACCOUNTS.map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        onClick={() => fillAccount(a.email)}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors hover:border-[#005F8C] hover:bg-white ${
                          email === a.email
                            ? "border-[#005F8C] bg-white"
                            : a.highlight
                            ? "border-[#06C755]/40 bg-[#eaf7f0]"
                            : "border-[#dce3ea] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${a.highlight ? "text-[#166534]" : "text-[#1a2332]"}`}>
                            {a.label}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.highlight
                              ? "bg-[#06C755]/10 text-[#166534]"
                              : "bg-[#005F8C]/10 text-[#005F8C]"
                          }`}>
                            {a.role}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#64748b] leading-tight">{a.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-[#64748b]">
        Rangers · マスターズ水泳グループ管理
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
