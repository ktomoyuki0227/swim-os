"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  updateProfile,
  uploadAvatar,
  getProfile,
  type ProfileActionState,
  type AvatarActionState,
} from "@/actions/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, ShieldCheck } from "lucide-react"

const initialProfileState: ProfileActionState = { error: null, success: false }
const initialAvatarState: AvatarActionState = { error: null, success: false }

const roleLabels: Record<string, string> = {
  swimmer: "スイマー",
  instructor: "指導員",
  admin: "管理者",
}

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(updateProfile, initialProfileState)
  const [avatarState, avatarAction, isAvatarPending] = useActionState(uploadAvatar, initialAvatarState)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      getProfile(),
      import("@/lib/supabase/client").then(({ createClient }) =>
        createClient().auth.getUser()
      ),
    ])
      .then(([profile, { data }]) => {
        if (profile) {
          setName(profile.name)
          setRole(profile.role)
          setAvatarUrl(profile.avatar_url)
        }
        if (data.user?.email) setEmail(data.user.email)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (avatarState.success && avatarState.avatarUrl) {
      setAvatarUrl(avatarState.avatarUrl)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [avatarState])

  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const displayUrl = previewUrl ?? avatarUrl

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* アバター */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-20 w-20">
              {isLoading ? (
                <Skeleton className="h-20 w-20 rounded-full" />
              ) : displayUrl ? (
                <Image
                  src={displayUrl}
                  alt={name}
                  fill
                  className="rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-medium text-primary-foreground ring-2 ring-border">
                  {initials || "?"}
                </span>
              )}
            </div>
            <form action={avatarAction} className="flex flex-col items-center gap-2">
              {avatarState.error && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {avatarState.error}
                </p>
              )}
              {avatarState.success && (
                <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  画像を更新しました。
                </p>
              )}
              <Label
                htmlFor="avatar"
                className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                画像を選択
              </Label>
              <input
                ref={fileInputRef}
                id="avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPreviewUrl(URL.createObjectURL(file))
                  }
                }}
              />
              {previewUrl && (
                <Button type="submit" size="sm" disabled={isAvatarPending}>
                  {isAvatarPending ? "アップロード中..." : "この画像を保存"}
                </Button>
              )}
            </form>
            <p className="text-xs text-muted-foreground">JPEG・PNG・WebP / 2MB以下</p>
          </div>

          {/* アカウント情報（読み取り専用） */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                メールアドレス
              </span>
              {isLoading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                <span className="text-right text-xs">{email}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                ロール
              </span>
              {isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Badge variant="secondary">{roleLabels[role] ?? role}</Badge>
              )}
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            {state.error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            {state.success && (
              <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                プロフィールを更新しました。
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending || isLoading}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
