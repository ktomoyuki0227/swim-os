"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login, loginWithGoogle, type AuthState } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: AuthState = { error: null }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">Rangers</CardTitle>
          <CardDescription>ログインしてレッスンを始めましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mail@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">パスワード</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                >
                  パスワードをお忘れですか？
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/95 px-2 text-muted-foreground">または</span>
            </div>
          </div>

          <form action={loginWithGoogle}>
            <Button variant="outline" className="w-full" type="submit">
              Google でログイン
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            アカウントをお持ちでない方は
            <Link href="/register" className="ml-1 text-primary underline">
              新規登録
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
