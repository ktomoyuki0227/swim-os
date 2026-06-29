"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { updateTeam, uploadTeamImage } from "@/actions/teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"
import { PRACTICE_FREQUENCIES, PRACTICE_DAYS } from "@/types/database"

interface Team {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  cover_image_url: string | null
  is_recruiting: boolean
  status: string | null
  activity_area: string | null
  practice_frequency: string | null
  practice_days: string[]
  main_pool: string | null
  has_session_fee: boolean
  has_annual_fee: boolean
  has_monthly_fee: boolean
  has_point_card: boolean
  default_member_price: number
  default_guest_price: number
  annual_fee_amount: number | null
  monthly_fee_amount: number | null
  cancellation_days: number
  point_card_count: number
  point_card_price: number | null
  contact_email: string | null
  contact_phone: string | null
  stripe_account_id: string | null
  stripe_onboarding_completed: boolean
  fee_members_exempt_session: boolean
}

interface EditTeamFormProps {
  team: Team
  stripeEnabled: boolean
  connectStatus: "success" | "pending" | "error" | null
}

export function EditTeamForm({ team, stripeEnabled, connectStatus }: EditTeamFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isConnecting, setIsConnecting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (connectStatus === "success") showToast("Stripe Connect の設定が完了しました", "success")
    else if (connectStatus === "pending") showToast("Stripe オンボーディングが未完了です。再度「設定を開始」してください", "error")
    else if (connectStatus === "error") showToast("Stripe Connect の設定中にエラーが発生しました", "error")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isRecruiting, setIsRecruiting] = useState(team.is_recruiting)
  const [isActive, setIsActive] = useState((team.status ?? "active") === "active")
  const [practiceDays, setPracticeDays] = useState<string[]>(team.practice_days ?? [])
  const [hasSessionFee, setHasSessionFee] = useState(team.has_session_fee)
  const [hasAnnualFee, setHasAnnualFee] = useState(team.has_annual_fee)
  const [hasMonthlyFee, setHasMonthlyFee] = useState(team.has_monthly_fee)
  const [hasPointCard, setHasPointCard] = useState(team.has_point_card)
  const [feeExempt, setFeeExempt] = useState(team.fee_members_exempt_session)

  // Image state
  const [coverPreview, setCoverPreview] = useState<string | null>(team.cover_image_url)
  const [iconPreview, setIconPreview] = useState<string | null>(team.avatar_url)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "icon"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (type === "cover") {
      setCoverFile(file)
      setCoverPreview(preview)
    } else {
      setIconFile(file)
      setIconPreview(preview)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id }),
      })
      if (!res.ok) throw new Error("onboarding request failed")
      const { url } = await res.json()
      window.location.href = url
    } catch {
      showToast("Stripe 設定の開始に失敗しました", "error")
      setIsConnecting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      let newCoverUrl: string | undefined
      let newIconUrl: string | undefined

      // Upload any newly-selected images first
      setImageUploading(true)
      try {
        if (coverFile) {
          const fd = new FormData()
          fd.append("file", coverFile)
          fd.append("type", "cover")
          const result = await uploadTeamImage(fd)
          if (result.error) {
            showToast(result.error, "error")
            return
          }
          newCoverUrl = result.url
        }

        if (iconFile) {
          const fd = new FormData()
          fd.append("file", iconFile)
          fd.append("type", "icon")
          const result = await uploadTeamImage(fd)
          if (result.error) {
            showToast(result.error, "error")
            return
          }
          newIconUrl = result.url
        }
      } finally {
        setImageUploading(false)
      }

      const annualFeeVal = parseInt(data.get("annual_fee_amount") as string)
      const monthlyFeeVal = parseInt(data.get("monthly_fee_amount") as string)
      const pointCardPriceVal = parseInt(data.get("point_card_price") as string)

      const payload: Record<string, unknown> = {
        name: data.get("name") as string,
        description: (data.get("description") as string) || undefined,
        activity_area: (data.get("activity_area") as string) || undefined,
        practice_frequency: (data.get("practice_frequency") as string) || null,
        practice_days: practiceDays,
        main_pool: (data.get("main_pool") as string) || null,
        is_recruiting: isRecruiting,
        status: isActive ? "active" : "inactive",
        has_session_fee: hasSessionFee,
        has_annual_fee: hasAnnualFee,
        has_monthly_fee: hasMonthlyFee,
        has_point_card: hasPointCard,
        default_member_price: hasSessionFee ? (parseInt(data.get("default_member_price") as string) || 0) : 0,
        default_guest_price: hasSessionFee ? (parseInt(data.get("default_guest_price") as string) || 0) : 0,
        annual_fee_amount: hasAnnualFee ? (Number.isNaN(annualFeeVal) ? undefined : annualFeeVal) : undefined,
        monthly_fee_amount: hasMonthlyFee ? (Number.isNaN(monthlyFeeVal) ? undefined : monthlyFeeVal) : undefined,
        cancellation_days: parseInt(data.get("cancellation_days") as string) || 3,
        point_card_count: hasPointCard ? (parseInt(data.get("point_card_count") as string) || team.point_card_count || 10) : undefined,
        point_card_price: hasPointCard ? (Number.isNaN(pointCardPriceVal) ? undefined : pointCardPriceVal) : undefined,
        contact_email: (data.get("contact_email") as string) || null,
        contact_phone: (data.get("contact_phone") as string) || null,
        fee_members_exempt_session: feeExempt,
      }

      if (newCoverUrl) payload.cover_image_url = newCoverUrl
      if (newIconUrl) payload.avatar_url = newIconUrl

      const result = await updateTeam(team.id, payload)
      if (result.error) {
        showToast(result.error, "error")
      } else {
        showToast("グループ情報を更新しました", "success")
        setTimeout(() => {
          router.push(`/teams/${team.id}?tab=settings`)
        }, 800)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/teams/${team.id}?tab=settings`} className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
          ← 設定に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[#1a2332]">グループ情報を編集</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">グループ名 <span className="text-[#c0392b]">*</span></Label>
              <Input
                id="name"
                name="name"
                defaultValue={team.name}
                placeholder="例: マウントリバー水泳クラブ"
                maxLength={100}
                required
                className="border-[#dce3ea]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">グループの説明</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={team.description ?? ""}
                placeholder="グループの活動内容や特徴を入力してください"
                rows={3}
                maxLength={2000}
                className="resize-none border-[#dce3ea]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity_area">
                活動エリア
                <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
              </Label>
              <Input
                id="activity_area"
                name="activity_area"
                defaultValue={team.activity_area ?? ""}
                placeholder="例: 東京都渋谷区"
                maxLength={100}
                className="border-[#dce3ea]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="main_pool">
                主な使用プール
                <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
              </Label>
              <Input
                id="main_pool"
                name="main_pool"
                defaultValue={team.main_pool ?? ""}
                placeholder="例: 渋谷区スポーツセンタープール"
                maxLength={200}
                className="border-[#dce3ea]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">
                問い合わせ用メールアドレス
                <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
              </Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="例：contact@example.com"
                defaultValue={team.contact_email ?? ""}
                maxLength={254}
                className="border-[#dce3ea]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_phone">
                問い合わせ用電話番号
                <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
              </Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                placeholder="09012345678"
                defaultValue={team.contact_phone ?? ""}
                maxLength={20}
                className="border-[#dce3ea]"
              />
              <p className="text-xs text-[#8d99a8]">ハイフンなし11桁で入力してください</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="practice_frequency">
                練習ペース
                <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
              </Label>
              <select
                id="practice_frequency"
                name="practice_frequency"
                defaultValue={team.practice_frequency ?? ""}
                className="h-10 w-full rounded-md border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
              >
                <option value="">選択してください</option>
                {PRACTICE_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>
                練習曜日
                <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意・複数選択可）</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_DAYS.map((day) => {
                  const checked = practiceDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setPracticeDays((prev) =>
                          checked ? prev.filter((d) => d !== day) : [...prev, day]
                        )
                      }
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                        checked
                          ? "border-[#005F8C] bg-[#005F8C] text-white"
                          : "border-[#dce3ea] bg-white text-[#5c6a7a] hover:border-[#005F8C]/50"
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>メンバー募集</Label>
              <div className="flex items-center gap-3 rounded-xl border border-[#dce3ea] p-3">
                <button
                  type="button"
                  onClick={() => setIsRecruiting((v) => !v)}
                  className={`relative h-6 w-10 rounded-full transition-colors ${
                    isRecruiting ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                  }`}
                  style={{ minHeight: "24px" }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isRecruiting ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-[#1a2332]">
                  {isRecruiting ? "メンバー募集中" : "募集停止中"}
                </span>
                <span className="ml-auto text-xs text-[#8d99a8]">公開ページに表示されます</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 画像設定 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">画像設定</CardTitle>
            <p className="text-xs text-[#5c6a7a]">変更したい画像のみ選択してください。</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* カバー画像 */}
            <div className="space-y-2">
              <Label>グループイメージ画像（ヒーロー）</Label>
              <div
                className="relative w-full overflow-hidden rounded-xl border border-dashed border-[#dce3ea] bg-[#f2f7fa] cursor-pointer hover:border-[#005F8C]/50 transition-colors"
                style={{ aspectRatio: "16/5" }}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <Image
                    src={coverPreview}
                    alt="カバー画像"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                    <span className="text-2xl">🖼</span>
                    <p className="text-xs text-[#8d99a8]">クリックして画像を選択</p>
                    <p className="text-xs text-[#8d99a8]">JPEG / PNG / WebP・5MB以下</p>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "cover")}
              />
              {coverPreview && (
                <button
                  type="button"
                  className="text-xs text-[#8d99a8] hover:text-[#5c6a7a]"
                  onClick={() => {
                    setCoverFile(null)
                    setCoverPreview(null)
                  }}
                >
                  × 削除
                </button>
              )}
            </div>

            {/* グループアイコン */}
            <div className="space-y-2">
              <Label>グループアイコン（丸アイコン）</Label>
              <div className="flex items-center gap-4">
                <div
                  className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border border-dashed border-[#dce3ea] bg-[#f2f7fa] hover:border-[#005F8C]/50 transition-colors"
                  onClick={() => iconInputRef.current?.click()}
                >
                  {iconPreview ? (
                    <Image
                      src={iconPreview}
                      alt="アイコン"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      <span className="text-2xl">🏊</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    className="rounded-lg border border-[#dce3ea] px-3 py-2 text-sm text-[#5c6a7a] hover:border-[#005F8C]/50 transition-colors"
                    style={{ minHeight: "44px" }}
                  >
                    画像を選択
                  </button>
                  <p className="mt-1 text-xs text-[#8d99a8]">JPEG / PNG / WebP・5MB以下</p>
                  {iconPreview && (
                    <button
                      type="button"
                      className="mt-1 text-xs text-[#8d99a8] hover:text-[#5c6a7a]"
                      onClick={() => {
                        setIconFile(null)
                        setIconPreview(null)
                      }}
                    >
                      × 削除
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={iconInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "icon")}
              />
            </div>
          </CardContent>
        </Card>

        {/* 料金体系 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">料金体系</CardTitle>
            <p className="text-xs text-[#5c6a7a]">このグループで利用する料金体系を選択してください。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* セッション参加費 */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce3ea] p-3 hover:border-[#005F8C]/40">
                <input
                  type="checkbox"
                  checked={hasSessionFee}
                  onChange={(e) => setHasSessionFee(e.target.checked)}
                  className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">セッション参加費あり</p>
                  <p className="text-xs text-[#8d99a8]">練習・イベントごとに参加費を徴収する</p>
                </div>
              </label>
              {hasSessionFee && (
                <div className="ml-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="default_member_price">参加費（メンバー）</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                      <Input
                        id="default_member_price"
                        name="default_member_price"
                        type="number"
                        min="0"
                        step="100"
                        defaultValue={team.default_member_price ?? 0}
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="default_guest_price">参加費（ゲスト）</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                      <Input
                        id="default_guest_price"
                        name="default_guest_price"
                        type="number"
                        min="0"
                        step="100"
                        defaultValue={team.default_guest_price ?? 0}
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 年会費 */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce3ea] p-3 hover:border-[#005F8C]/40">
                <input
                  type="checkbox"
                  checked={hasAnnualFee}
                  onChange={(e) => {
                    setHasAnnualFee(e.target.checked)
                    if (!e.target.checked && !hasMonthlyFee) setFeeExempt(false)
                  }}
                  className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">年会費あり</p>
                  <p className="text-xs text-[#8d99a8]">年1回の会費を徴収する</p>
                </div>
              </label>
              {hasAnnualFee && (
                <div className="ml-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="annual_fee_amount">年会費金額</Label>
                    <div className="relative w-40">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                      <Input
                        id="annual_fee_amount"
                        name="annual_fee_amount"
                        type="number"
                        min="0"
                        step="100"
                        defaultValue={team.annual_fee_amount ?? ""}
                        placeholder="0"
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 月謝 */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce3ea] p-3 hover:border-[#005F8C]/40">
                <input
                  type="checkbox"
                  checked={hasMonthlyFee}
                  onChange={(e) => {
                    setHasMonthlyFee(e.target.checked)
                    if (!e.target.checked && !hasAnnualFee) setFeeExempt(false)
                  }}
                  className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">月謝あり</p>
                  <p className="text-xs text-[#8d99a8]">毎月の月謝を徴収する</p>
                </div>
              </label>
              {hasMonthlyFee && (
                <div className="ml-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="monthly_fee_amount">月謝金額</Label>
                    <div className="relative w-40">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                      <Input
                        id="monthly_fee_amount"
                        name="monthly_fee_amount"
                        type="number"
                        min="0"
                        step="100"
                        defaultValue={team.monthly_fee_amount ?? ""}
                        placeholder="0"
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 会費会員の参加費免除 */}
            {(hasAnnualFee || hasMonthlyFee) && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#005F8C]/20 bg-[#005F8C]/5 p-3 hover:border-[#005F8C]/40">
                <input
                  type="checkbox"
                  checked={feeExempt}
                  onChange={(e) => setFeeExempt(e.target.checked)}
                  className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">年会費・月謝会員のセッション参加費を免除</p>
                  <p className="text-xs text-[#8d99a8]">年会費または月謝を支払っているメンバーはセッション参加費が無料になる</p>
                </div>
              </label>
            )}

            {/* 回数券 */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce3ea] p-3 hover:border-[#005F8C]/40">
                <input
                  type="checkbox"
                  checked={hasPointCard}
                  onChange={(e) => setHasPointCard(e.target.checked)}
                  className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">回数券あり</p>
                  <p className="text-xs text-[#8d99a8]">スタンプカード方式で回数管理をする</p>
                </div>
              </label>
              {hasPointCard && (
                <div className="ml-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="point_card_count">1枚あたりの回数</Label>
                    <Input
                      id="point_card_count"
                      name="point_card_count"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue={team.point_card_count ?? 10}
                      className="border-[#dce3ea]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="point_card_price">
                      回数券の価格
                      <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                      <Input
                        id="point_card_price"
                        name="point_card_price"
                        type="number"
                        min="0"
                        step="100"
                        defaultValue={team.point_card_price ?? ""}
                        placeholder="未設定"
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* キャンセルポリシー */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">キャンセルポリシー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="cancellation_days">無料キャンセル期限（当日から何日前まで）</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellation_days"
                  name="cancellation_days"
                  type="number"
                  min="0"
                  max="30"
                  defaultValue={team.cancellation_days ?? 3}
                  className="w-24 border-[#dce3ea]"
                />
                <span className="text-sm text-[#5c6a7a]">日前まで無料キャンセル可</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* グループのステータス */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">グループのステータス</CardTitle>
            <p className="text-xs text-[#5c6a7a]">非アクティブにすると公開ページから非表示になります。</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl border border-[#dce3ea] p-3">
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative h-6 w-10 rounded-full transition-colors ${
                  isActive ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                }`}
                style={{ minHeight: "24px" }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    isActive ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[#1a2332]">
                {isActive ? "アクティブ" : "非アクティブ"}
              </span>
              <span className="ml-auto text-xs text-[#8d99a8]">
                {isActive ? "公開中" : "非公開"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href={`/teams/${team.id}?tab=settings`} className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-[#dce3ea] text-[#5c6a7a]"
              style={{ minHeight: "48px" }}
            >
              キャンセル
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending || imageUploading}
            className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]"
            style={{ minHeight: "48px" }}
          >
            {isPending || imageUploading ? "保存中..." : "変更を保存"}
          </Button>
        </div>
      </form>

      {/* Stripe Connect — 決済送金設定（Stripe 設定済み時のみ表示） */}
      {stripeEnabled && (
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">
              Stripe Connect（売上受取設定）
            </CardTitle>
            <p className="text-xs text-[#5c6a7a]">
              セッション参加費の売上をこのグループの Stripe アカウントに自動送金します。設定するとプラットフォーム手数料を差し引いた金額がグループに入金されます。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#dce3ea] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-lg">
                  💳
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">Connect ステータス</p>
                  <div className="mt-0.5">
                    {team.stripe_onboarding_completed ? (
                      <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent">設定完了</Badge>
                    ) : team.stripe_account_id ? (
                      <Badge className="bg-[#fdf6e3] text-[#b8860b] border-transparent">審査・設定中</Badge>
                    ) : (
                      <Badge className="bg-[#edf0f4] text-[#5c6a7a] border-transparent">未設定</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                variant={team.stripe_onboarding_completed ? "outline" : "default"}
                className={
                  team.stripe_onboarding_completed
                    ? "rounded-full border-[#dce3ea] text-[#5c6a7a] shrink-0"
                    : "rounded-full bg-[#005F8C] hover:bg-[#004E73] shrink-0"
                }
                style={{ minHeight: "44px" }}
              >
                {isConnecting
                  ? "移動中..."
                  : team.stripe_account_id
                  ? "設定を続ける"
                  : "設定を開始"}
              </Button>
            </div>
            {team.stripe_onboarding_completed && (
              <p className="text-xs text-[#8d99a8]">
                Stripe ダッシュボードから売上・入金状況を確認できます。設定を変更する場合は「設定を続ける」から Stripe 管理画面にアクセスしてください。
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
