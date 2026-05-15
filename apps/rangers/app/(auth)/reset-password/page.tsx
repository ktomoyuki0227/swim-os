"use client"

import { useActionState } from "react"
import { updatePassword, type ResetPasswordState } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: ResetPasswordState = { error: null, success: false }

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState)

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">新しいパスワードを設定</CardTitle>
          <CardDescription>
            新しいパスワードを入力してください（6文字以上）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">新しいパスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">パスワード（確認）</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "更新中..." : "パスワードを更新"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-slate-400">
        Rangers · マスターズ水泳レッスン予約
      </p>
    </div>
  )
}
