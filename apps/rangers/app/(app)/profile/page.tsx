"use client"

import { useActionState, useEffect, useState } from "react"
import { updateProfile, getProfile, type ProfileActionState } from "@/actions/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const initialState: ProfileActionState = { error: null, success: false }

const roleLabels: Record<string, string> = {
  swimmer: "スイマー",
  instructor: "指導員",
  admin: "管理者",
}

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState
  )
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile) {
        setName(profile.name)
        setRole(profile.role)
      }
    })
    // メールアドレスはsupabase authから取得
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email)
      })
    })
  }, [])

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* アカウント情報（読み取り専用） */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">メールアドレス</span>
              <span>{email || "取得中..."}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ロール</span>
              <Badge variant="secondary">{roleLabels[role] ?? role}</Badge>
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-green-600">
                プロフィールを更新しました。
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
