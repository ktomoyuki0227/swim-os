"use client"

import { useActionState } from "react"
import Link from "next/link"
import { register, type AuthState } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: AuthState = { error: null }

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState)

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">新規登録</CardTitle>
          <CardDescription>Rangers アカウントを作成</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" name="name" placeholder="山田太郎" required />
            </div>
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
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>登録タイプ</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-muted p-3 hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="role"
                    value="swimmer"
                    defaultChecked
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">スイマー</span>
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-muted p-3 hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="role"
                    value="instructor"
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">指導員</span>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "登録中..." : "アカウントを作成"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は
            <Link href="/login" className="ml-1 text-primary underline">
              ログイン
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
