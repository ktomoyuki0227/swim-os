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
import { SWIM_SPECIALTIES, TARGET_AGES, PREFECTURES } from "@/types/database"
import type { Profile } from "@/types/database"

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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [career, setCareer] = useState("")
  const [achievements, setAchievements] = useState("")
  const [prefecture, setPrefecture] = useState("")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [targetAges, setTargetAges] = useState<string[]>([])
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
      .then(([p, { data }]) => {
        if (p) {
          const prof = p as Profile
          setProfile(prof)
          setName(prof.name)
          setBio(prof.bio ?? "")
          setCareer(prof.career ?? "")
          setAchievements(prof.achievements ?? "")
          setPrefecture(prof.prefecture ?? "")
          setSpecialties(prof.specialties ?? [])
          setTargetAges(prof.target_ages ?? [])
          setAvatarUrl(prof.avatar_url)
        }
        if (data.user?.email) setEmail(data.user.email)
      })
      .finally(() => setIsLoading(false))
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
  const isInstructor = profile?.role === "instructor"

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleTargetAge(a: string) {
    setTargetAges((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">プロフィール設定</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">アカウント情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* アバター */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
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
            <form action={avatarAction} className="flex flex-col gap-2">
              {avatarState.error && (
                <p role="alert" className="text-sm text-destructive">{avatarState.error}</p>
              )}
              {avatarState.success && (
                <p role="status" className="text-sm text-green-700">画像を更新しました</p>
              )}
              <Label htmlFor="avatar" className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                画像を変更
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
                  if (file) setPreviewUrl(URL.createObjectURL(file))
                }}
              />
              {previewUrl && (
                <Button type="submit" size="sm" disabled={isAvatarPending}>
                  {isAvatarPending ? "アップロード中..." : "この画像を保存"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPEG・PNG・WebP / 2MB以下</p>
            </form>
          </div>

          {/* 読み取り専用情報 */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                メールアドレス
              </span>
              {isLoading ? <Skeleton className="h-4 w-40" /> : <span className="text-xs">{email}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                ロール
              </span>
              {isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Badge variant="secondary">{roleLabels[profile?.role ?? ""] ?? profile?.role}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form action={formAction} className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
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
          </CardContent>
        </Card>

        {/* 指導員向け追加フィールド */}
        {isInstructor && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">コーチプロフィール</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bio">自己紹介</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="あなたの指導スタイルや強みを教えてください"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="career">経歴</Label>
                  <textarea
                    id="career"
                    name="career"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    rows={4}
                    placeholder="例）○○大学体育会水泳部、日本選手権出場、指導歴10年など"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="achievements">実績</Label>
                  <textarea
                    id="achievements"
                    name="achievements"
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    rows={3}
                    placeholder="例）国体出場、全日本マスターズ優勝、指導した生徒の入賞など"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prefecture">活動地域（都道府県）</Label>
                  <select
                    id="prefecture"
                    name="prefecture"
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">得意種目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SWIM_SPECIALTIES.map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input
                        type="checkbox"
                        name="specialties"
                        value={s}
                        checked={specialties.includes(s)}
                        onChange={() => toggleSpecialty(s)}
                        className="sr-only"
                      />
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm transition-colors ${
                          specialties.includes(s)
                            ? "bg-blue-500 text-white"
                            : "border hover:bg-muted"
                        }`}
                      >
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">指導対象</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TARGET_AGES.map((a) => (
                    <label key={a} className="cursor-pointer">
                      <input
                        type="checkbox"
                        name="target_ages"
                        value={a}
                        checked={targetAges.includes(a)}
                        onChange={() => toggleTargetAge(a)}
                        className="sr-only"
                      />
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm transition-colors ${
                          targetAges.includes(a)
                            ? "bg-blue-500 text-white"
                            : "border hover:bg-muted"
                        }`}
                      >
                        {a}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={isPending || isLoading}>
          {isPending ? "保存中..." : "プロフィールを保存"}
        </Button>
      </form>
    </div>
  )
}
