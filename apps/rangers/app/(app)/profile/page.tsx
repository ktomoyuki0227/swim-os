"use client"

import { useActionState, useEffect, useState } from "react"
import { updateProfile, getProfile, type ProfileActionState } from "@/actions/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: ProfileActionState = { error: null, success: false }

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState
  )
  const [name, setName] = useState("")

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile) {
        setName(profile.name)
      }
    })
  }, [])

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
        </CardHeader>
        <CardContent>
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
