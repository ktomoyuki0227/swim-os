"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { updatePassword, type ResetPasswordState } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const initialState: ResetPasswordState = { error: null, success: false }

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const mismatch = confirm.length > 0 && password !== confirm

  if (state.success) {
    return (
      <div className="w-full max-w-md">
        <Card className="w-full border-[#dce3ea] bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7f0]">
              <CheckCircle2 className="h-7 w-7 text-[#0f8a4f]" />
            </div>
            <CardTitle className="text-xl text-[#0f8a4f]">パスワードを更新しました</CardTitle>
            <CardDescription>
              新しいパスワードでログインしてください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">ログインページへ</Button>
            </Link>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-[#64748b]">
          Rangers · マスターズ水泳レッスン予約
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-[#dce3ea] bg-white shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#005F8C]">新しいパスワードを設定</CardTitle>
          <CardDescription>
            新しいパスワードを入力してください（6文字以上）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <p role="alert" className="rounded-md bg-[#fdecea] px-3 py-2 text-sm text-[#c0392b]">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={mismatch}
              />
              {mismatch && (
                <p role="alert" className="text-xs text-[#c0392b]">
                  パスワードが一致しません
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || mismatch}
            >
              {isPending ? "更新中..." : "パスワードを更新"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-[#64748b]">
        Rangers · マスターズ水泳レッスン予約
      </p>
    </div>
  )
}
