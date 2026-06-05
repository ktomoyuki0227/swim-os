"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  updateProfile,
  uploadAvatar,
  getProfile,
  type ProfileActionState,
  type AvatarActionState,
} from "@/actions/profile"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/toast"
import { SWIM_SPECIALTIES, TARGET_AGES, PREFECTURES } from "@/types/database"
import type { Profile } from "@/types/database"

const initialProfileState: ProfileActionState = { error: null, success: false }
const initialAvatarState: AvatarActionState = { error: null, success: false }

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-[#005F8C]" : "bg-[#dce3ea]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateProfile, initialProfileState)
  const [avatarState, avatarAction, isAvatarPending] = useActionState(uploadAvatar, initialAvatarState)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  // 基本情報
  const [name, setName] = useState("")
  const [furigana, setFurigana] = useState("")
  const [gender, setGender] = useState("")
  const [birthday, setBirthday] = useState("")
  const [address, setAddress] = useState("")
  const [swimwearSize, setSwimwearSize] = useState("")

  // 緊急連絡先
  const [emergencyContact, setEmergencyContact] = useState("")
  const [emergencyContactName, setEmergencyContactName] = useState("")
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("")

  // 登録情報
  const [mastersRegistered, setMastersRegistered] = useState(false)
  const [mastersNumber, setMastersNumber] = useState("")
  const [jsaRegistered, setJsaRegistered] = useState(false)
  const [jsaNumber, setJsaNumber] = useState("")

  // コーチプロフィール
  const [bio, setBio] = useState("")
  const [career, setCareer] = useState("")
  const [achievements, setAchievements] = useState("")
  const [prefecture, setPrefecture] = useState("")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [targetAges, setTargetAges] = useState<string[]>([])

  // アバター
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (state.error) showToast(state.error, "error")
    if (state.success) showToast("プロフィールを更新しました", "success")
  }, [state.error, state.success])

  useEffect(() => {
    if (avatarState.error) showToast(avatarState.error, "error")
    if (avatarState.success) showToast("画像を更新しました", "success")
  }, [avatarState.error, avatarState.success])

  useEffect(() => {
    Promise.all([
      getProfile(),
      createClient().auth.getUser(),
    ]).then(([p, { data }]) => {
      if (p) {
        const prof = p as Profile
        setProfile(prof)
        setName(prof.name)
        setFurigana(prof.furigana ?? "")
        setGender(prof.gender ?? "")
        setBirthday(prof.birthday ?? "")
        setAddress(prof.address ?? "")
        setSwimwearSize(prof.swimwear_size ?? "")
        setEmergencyContact(prof.emergency_contact ?? "")
        setEmergencyContactName(prof.emergency_contact_name ?? "")
        setEmergencyContactRelation(prof.emergency_contact_relation ?? "")
        setMastersRegistered(prof.masters_registered ?? false)
        setMastersNumber(prof.masters_number ?? "")
        setJsaRegistered(prof.jsa_registered ?? false)
        setJsaNumber(prof.jsa_number ?? "")
        setBio(prof.bio ?? "")
        setCareer(prof.career ?? "")
        setAchievements(prof.achievements ?? "")
        setPrefecture(prof.prefecture ?? "")
        setSpecialties(prof.specialties ?? [])
        setTargetAges(prof.target_ages ?? [])
        setAvatarUrl(prof.avatar_url)
      }
      if (data.user?.email) setEmail(data.user.email)
    }).finally(() => setIsLoading(false))
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
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-[#1a2332]">プロフィール設定</h1>

      {/* アバター・メール */}
      <Card className="border-[#dce3ea]">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              {isLoading ? (
                <Skeleton className="h-20 w-20 rounded-full" />
              ) : displayUrl ? (
                <Image
                  src={displayUrl}
                  alt={name}
                  fill
                  className="rounded-full object-cover ring-2 ring-[#dce3ea]"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#005F8C]/10 text-2xl font-semibold text-[#005F8C] ring-2 ring-[#dce3ea]">
                  {initials || "?"}
                </span>
              )}
            </div>
            <form action={avatarAction} className="flex flex-col gap-2">
              <Label
                htmlFor="avatar"
                className="cursor-pointer rounded-full border border-[#dce3ea] px-4 py-1.5 text-sm text-[#5c6a7a] hover:border-[#005F8C] hover:text-[#005F8C] transition-colors"
              >
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
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAvatarPending}
                  className="rounded-full bg-[#005F8C] hover:bg-[#004E73] text-xs"
                >
                  {isAvatarPending ? "保存中..." : "この画像を保存"}
                </Button>
              )}
              <p className="text-xs text-[#8d99a8]">JPEG・PNG・WebP / 2MB以下</p>
            </form>
          </div>

          <div className="rounded-xl bg-[#f7fafc] px-4 py-3 text-sm">
            <span className="text-[#8d99a8]">メールアドレス</span>
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-48" />
            ) : (
              <p className="mt-0.5 font-medium text-[#1a2332]">{email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <form action={formAction} className="space-y-6">

        {/* 基本情報 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm text-[#5c6a7a]">
                  名前 <span className="text-[#E8614D]">*</span>
                </Label>
                {isLoading ? <Skeleton className="h-10 w-full" /> : (
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-[#dce3ea]"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="furigana" className="text-sm text-[#5c6a7a]">フリガナ</Label>
                {isLoading ? <Skeleton className="h-10 w-full" /> : (
                  <Input
                    id="furigana"
                    name="furigana"
                    value={furigana}
                    onChange={(e) => setFurigana(e.target.value)}
                    placeholder="ヤマダ ケンタ"
                    className="border-[#dce3ea]"
                  />
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-sm text-[#5c6a7a]">性別</Label>
                <select
                  id="gender"
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
                >
                  <option value="">選択してください</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthday" className="text-sm text-[#5c6a7a]">生年月日</Label>
                <Input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm text-[#5c6a7a]">住所</Label>
              <Input
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例: 東京都渋谷区..."
                className="border-[#dce3ea]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="swimwear_size" className="text-sm text-[#5c6a7a]">水着サイズ</Label>
              <Input
                id="swimwear_size"
                name="swimwear_size"
                value={swimwearSize}
                onChange={(e) => setSwimwearSize(e.target.value)}
                placeholder="例: S・M・L・XL"
                className="border-[#dce3ea]"
              />
            </div>
          </CardContent>
        </Card>

        {/* 緊急連絡先 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">緊急連絡先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="emergency_contact" className="text-sm text-[#5c6a7a]">電話番号</Label>
              <Input
                id="emergency_contact"
                name="emergency_contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="例: 090-0000-0000"
                className="border-[#dce3ea]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_name" className="text-sm text-[#5c6a7a]">氏名</Label>
                <Input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="例: 山田花子"
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_relation" className="text-sm text-[#5c6a7a]">続柄</Label>
                <Input
                  id="emergency_contact_relation"
                  name="emergency_contact_relation"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  placeholder="例: 母・配偶者"
                  className="border-[#dce3ea]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 登録情報 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">登録情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* マスターズ */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="hidden" name="masters_registered" value={mastersRegistered ? "true" : "false"} />
                <Toggle checked={mastersRegistered} onChange={setMastersRegistered} />
                <span className="text-sm font-medium text-[#1a2332]">マスターズ登録あり</span>
              </label>
              <div className="space-y-1.5 pl-14">
                <Label htmlFor="masters_number" className="text-sm text-[#5c6a7a]">登録番号</Label>
                <Input
                  id="masters_number"
                  name="masters_number"
                  value={mastersNumber}
                  onChange={(e) => setMastersNumber(e.target.value)}
                  placeholder="登録番号を入力"
                  className="border-[#dce3ea]"
                />
              </div>
            </div>

            <div className="border-t border-[#dce3ea]" />

            {/* JSA */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="hidden" name="jsa_registered" value={jsaRegistered ? "true" : "false"} />
                <Toggle checked={jsaRegistered} onChange={setJsaRegistered} />
                <span className="text-sm font-medium text-[#1a2332]">日本水泳連盟登録あり</span>
              </label>
              <div className="space-y-1.5 pl-14">
                <Label htmlFor="jsa_number" className="text-sm text-[#5c6a7a]">登録番号</Label>
                <Input
                  id="jsa_number"
                  name="jsa_number"
                  value={jsaNumber}
                  onChange={(e) => setJsaNumber(e.target.value)}
                  placeholder="登録番号を入力"
                  className="border-[#dce3ea]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* コーチプロフィール */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">コーチプロフィール</CardTitle>
            <p className="text-xs text-[#8d99a8]">インストラクターとして活動する場合に入力してください</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-sm text-[#5c6a7a]">自己紹介</Label>
              <textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="指導スタイルや強みを教えてください"
                className="w-full resize-none rounded-lg border border-[#dce3ea] bg-white px-3 py-2 text-sm text-[#1a2332] placeholder:text-[#8d99a8] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="career" className="text-sm text-[#5c6a7a]">経歴</Label>
              <textarea
                id="career"
                name="career"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                rows={3}
                placeholder="例: ○○大学体育会水泳部、日本選手権出場、指導歴10年"
                className="w-full resize-none rounded-lg border border-[#dce3ea] bg-white px-3 py-2 text-sm text-[#1a2332] placeholder:text-[#8d99a8] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="achievements" className="text-sm text-[#5c6a7a]">実績</Label>
              <textarea
                id="achievements"
                name="achievements"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                rows={3}
                placeholder="例: 国体出場、全日本マスターズ優勝、指導した選手の入賞"
                className="w-full resize-none rounded-lg border border-[#dce3ea] bg-white px-3 py-2 text-sm text-[#1a2332] placeholder:text-[#8d99a8] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prefecture" className="text-sm text-[#5c6a7a]">活動地域（都道府県）</Label>
              <select
                id="prefecture"
                name="prefecture"
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 得意種目 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">得意種目</CardTitle>
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
                    onChange={() =>
                      setSpecialties((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    className="sr-only"
                  />
                  <span
                    className={`inline-block rounded-full px-3 py-1.5 text-sm transition-colors ${
                      specialties.includes(s)
                        ? "bg-[#005F8C] text-white"
                        : "border border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C] hover:text-[#005F8C]"
                    }`}
                  >
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 指導対象 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">指導対象年齢</CardTitle>
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
                    onChange={() =>
                      setTargetAges((prev) =>
                        prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                      )
                    }
                    className="sr-only"
                  />
                  <span
                    className={`inline-block rounded-full px-3 py-1.5 text-sm transition-colors ${
                      targetAges.includes(a)
                        ? "bg-[#005F8C] text-white"
                        : "border border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C] hover:text-[#005F8C]"
                    }`}
                  >
                    {a}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73] text-white"
          style={{ minHeight: "48px" }}
          disabled={isPending || isLoading}
        >
          {isPending ? "保存中..." : "プロフィールを保存"}
        </Button>
      </form>

      <div className="border-t border-[#dce3ea] pb-10 pt-6">
        <Button
          variant="outline"
          className="w-full rounded-full border-[#E8614D]/40 text-[#E8614D] hover:bg-[#E8614D]/5"
          style={{ minHeight: "44px" }}
          onClick={async () => {
            await createClient().auth.signOut()
            router.push("/login")
          }}
        >
          ログアウト
        </Button>
      </div>
    </div>
  )
}
