"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordReset, type ResetPasswordState } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

const initialState: ResetPasswordState = { error: null, success: false }

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState)

  if (state.success) {
    return (
      <div className="w-full max-w-md">
        <Card className="w-full border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Mail className="h-7 w-7 text-blue-500" />
            </div>
            <CardTitle className="text-xl text-blue-600">メールを送信しました</CardTitle>
            <CardDescription>
              パスワードリセット用のリンクをお送りしました。メールをご確認ください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              メールが届かない場合は迷惑メールフォルダもご確認ください。
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                ログインページへ戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-slate-400">
          Rangers · マスターズ水泳レッスン予約
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">パスワードをお忘れですか？</CardTitle>
          <CardDescription>
            登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mail@example.com"
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "送信中..." : "リセットリンクを送信"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary underline underline-offset-4">
              ログインに戻る
            </Link>
          </p>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-slate-400">
        Rangers · マスターズ水泳レッスン予約
      </p>
    </div>
  )
}
