"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createTeam, uploadTeamImage } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"
import { PRACTICE_FREQUENCIES, PRACTICE_DAYS } from "@/types/database"

interface Step1Data {
  name: string
  description: string
  activity_area: string
  is_recruiting: boolean
  practice_frequency: string
  practice_days: string[]
  main_pool: string
  contact_email: string
  contact_phone: string
}

interface Step2Data {
  coverFile: File | null
  iconFile: File | null
  coverPreview: string | null
  iconPreview: string | null
}

export default function NewTeamPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Fee flags state
  const [hasSessionFee, setHasSessionFee] = useState(true)
  const [hasAnnualFee, setHasAnnualFee] = useState(false)
  const [hasMonthlyFee, setHasMonthlyFee] = useState(false)
  const [hasPointCard, setHasPointCard] = useState(false)

  // Step 1 state
  const [step1, setStep1] = useState<Step1Data>({
    name: "",
    description: "",
    activity_area: "",
    is_recruiting: true,
    practice_frequency: "",
    practice_days: [],
    main_pool: "",
    contact_email: "",
    contact_phone: "",
  })

  // Step 2 state
  const [step2, setStep2] = useState<Step2Data>({
    coverFile: null,
    iconFile: null,
    coverPreview: null,
    iconPreview: null,
  })
  const [uploading, setUploading] = useState(false)

  // Uploaded URLs (set after upload)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const handleStep1Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    setStep1({
      name: data.get("name") as string,
      description: (data.get("description") as string) || "",
      activity_area: (data.get("activity_area") as string) || "",
      is_recruiting: step1.is_recruiting,
      practice_frequency: (data.get("practice_frequency") as string) || "",
      practice_days: step1.practice_days,
      main_pool: (data.get("main_pool") as string) || "",
      contact_email: (data.get("contact_email") as string) || "",
      contact_phone: (data.get("contact_phone") as string) || "",
    })
    setStep(2)
  }

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "icon"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (type === "cover") {
      setStep2((prev) => ({ ...prev, coverFile: file, coverPreview: preview }))
    } else {
      setStep2((prev) => ({ ...prev, iconFile: file, iconPreview: preview }))
    }
  }

  const handleStep2Next = async () => {
    setUploading(true)
    try {
      let newCoverUrl: string | null = null
      let newIconUrl: string | null = null

      if (step2.coverFile) {
        const fd = new FormData()
        fd.append("file", step2.coverFile)
        fd.append("type", "cover")
        const result = await uploadTeamImage(fd)
        if (result.error) {
          showToast(result.error, "error")
          return
        }
        newCoverUrl = result.url ?? null
      }

      if (step2.iconFile) {
        const fd = new FormData()
        fd.append("file", step2.iconFile)
        fd.append("type", "icon")
        const result = await uploadTeamImage(fd)
        if (result.error) {
          showToast(result.error, "error")
          return
        }
        newIconUrl = result.url ?? null
      }

      setCoverImageUrl(newCoverUrl)
      setIconImageUrl(newIconUrl)
      setStep(3)
    } finally {
      setUploading(false)
    }
  }

  const handleStep3Submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const annualFeeVal = parseInt(data.get("annual_fee_amount") as string)
    const monthlyFeeVal = parseInt(data.get("monthly_fee_amount") as string)
    const pointCardPriceVal = parseInt(data.get("point_card_price") as string)

    const payload = {
      name: step1.name,
      description: step1.description || undefined,
      activity_area: step1.activity_area || undefined,
      is_recruiting: step1.is_recruiting,
      practice_frequency: step1.practice_frequency || undefined,
      practice_days: step1.practice_days,
      main_pool: step1.main_pool || undefined,
      cover_image_url: coverImageUrl || undefined,
      avatar_url: iconImageUrl || undefined,
      has_session_fee: hasSessionFee,
      has_annual_fee: hasAnnualFee,
      has_monthly_fee: hasMonthlyFee,
      has_point_card: hasPointCard,
      default_member_price: hasSessionFee ? (parseInt(data.get("default_member_price") as string) || 0) : 0,
      default_guest_price: hasSessionFee ? (parseInt(data.get("default_guest_price") as string) || 0) : 0,
      annual_fee_amount: hasAnnualFee ? (Number.isNaN(annualFeeVal) ? undefined : annualFeeVal) : undefined,
      monthly_fee_amount: hasMonthlyFee ? (Number.isNaN(monthlyFeeVal) ? undefined : monthlyFeeVal) : undefined,
      cancellation_days: parseInt(data.get("cancellation_days") as string) || 3,
      point_card_count: hasPointCard ? (parseInt(data.get("point_card_count") as string) || 10) : undefined,
      point_card_price: hasPointCard ? (Number.isNaN(pointCardPriceVal) ? undefined : pointCardPriceVal) : undefined,
      contact_email: step1.contact_email || undefined,
      contact_phone: step1.contact_phone || undefined,
    }

    startTransition(async () => {
      const result = await createTeam(payload)
      if (result.error) {
        showToast(result.error, "error")
      } else if (result.data) {
        router.push(`/teams/${result.data.id}`)
      }
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/teams" className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
          ← グループ一覧
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[#1a2332]">グループを作成</h1>
      </div>

      {/* ステップインジケーター */}
      <div className="flex justify-center">
        <div className="flex items-center">
          {([1, 2, 3] as const).map((n, i) => (
            <div key={n} className="flex items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  step > n
                    ? "bg-[#005F8C]/20 text-[#005F8C]"
                    : step === n
                    ? "bg-[#005F8C] text-white"
                    : "bg-[#edf0f4] text-[#5c6a7a]"
                }`}
              >
                {step > n ? "✓" : n}
              </div>
              {i < 2 && (
                <div
                  className={`h-0.5 w-16 transition-colors ${
                    step > n ? "bg-[#005F8C]/40" : "bg-[#dce3ea]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: 基本情報 */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  グループ名 <span className="text-[#E8614D]">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="例: マウントリバー水泳クラブ"
                  defaultValue={step1.name}
                  maxLength={100}
                  required
                  autoFocus
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">
                  グループの説明
                  <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="活動内容や特徴を入力してください"
                  defaultValue={step1.description}
                  rows={4}
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
                  placeholder="例: 東京都渋谷区"
                  defaultValue={step1.activity_area}
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
                  placeholder="例: 渋谷区スポーツセンタープール"
                  defaultValue={step1.main_pool}
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
                  defaultValue={step1.contact_email}
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
                  defaultValue={step1.contact_phone}
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
                  defaultValue={step1.practice_frequency}
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
                    const checked = step1.practice_days.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setStep1((prev) => ({
                            ...prev,
                            practice_days: checked
                              ? prev.practice_days.filter((d) => d !== day)
                              : [...prev.practice_days, day],
                          }))
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
                    onClick={() =>
                      setStep1((prev) => ({ ...prev, is_recruiting: !prev.is_recruiting }))
                    }
                    className={`relative h-6 w-10 rounded-full transition-colors ${
                      step1.is_recruiting ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                    }`}
                    style={{ minHeight: "24px" }}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        step1.is_recruiting ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-[#1a2332]">
                    {step1.is_recruiting ? "メンバー募集中" : "募集停止中"}
                  </span>
                  <span className="ml-auto text-xs text-[#8d99a8]">公開ページに表示されます</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73]"
            style={{ minHeight: "48px" }}
          >
            次へ →
          </Button>
        </form>
      )}

      {/* Step 2: 画像設定 */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-5 pt-5">
              <div>
                <p className="text-sm font-semibold text-[#1a2332]">画像設定</p>
                <p className="mt-0.5 text-xs text-[#5c6a7a]">両方任意です。後から変更できます。</p>
              </div>

              {/* カバー画像 */}
              <div className="space-y-2">
                <Label>グループイメージ画像（ヒーロー）</Label>
                <div
                  className="relative w-full overflow-hidden rounded-xl border border-dashed border-[#dce3ea] bg-[#f5f8fa] cursor-pointer hover:border-[#005F8C]/50 transition-colors"
                  style={{ aspectRatio: "16/5" }}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {step2.coverPreview ? (
                    <Image
                      src={step2.coverPreview}
                      alt="カバー画像プレビュー"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                      <span className="text-2xl">🖼</span>
                      <p className="text-xs text-[#8d99a8]">クリックして画像を選択</p>
                      <p className="text-[10px] text-[#b0bac6]">JPEG / PNG / WebP・5MB以下</p>
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
                {step2.coverPreview && (
                  <button
                    type="button"
                    className="text-xs text-[#8d99a8] hover:text-[#5c6a7a]"
                    onClick={() => {
                      setStep2((prev) => ({ ...prev, coverFile: null, coverPreview: null }))
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
                    className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border border-dashed border-[#dce3ea] bg-[#f5f8fa] hover:border-[#005F8C]/50 transition-colors"
                    onClick={() => iconInputRef.current?.click()}
                  >
                    {step2.iconPreview ? (
                      <Image
                        src={step2.iconPreview}
                        alt="アイコンプレビュー"
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
                    <p className="mt-1 text-[10px] text-[#b0bac6]">JPEG / PNG / WebP・5MB以下</p>
                    {step2.iconPreview && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-[#8d99a8] hover:text-[#5c6a7a]"
                        onClick={() => {
                          setStep2((prev) => ({ ...prev, iconFile: null, iconPreview: null }))
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 rounded-full border-[#dce3ea] text-[#5c6a7a]"
              style={{ minHeight: "48px" }}
            >
              ← 戻る
            </Button>
            <Button
              type="button"
              disabled={uploading}
              onClick={handleStep2Next}
              className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73] disabled:opacity-40"
              style={{ minHeight: "48px" }}
            >
              {uploading ? "アップロード中..." : "次へ →"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 料金・ポリシー設定 */}
      {step === 3 && (
        <form onSubmit={handleStep3Submit} className="space-y-4">
          {/* グループ名の確認表示 */}
          <div className="rounded-xl bg-[#f2f7fa] px-4 py-3">
            <p className="text-xs text-[#5c6a7a]">グループ名</p>
            <p className="font-medium text-[#1a2332]">{step1.name}</p>
          </div>

          {/* 料金体系選択 */}
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <div>
                <p className="text-sm font-semibold text-[#1a2332]">料金体系</p>
                <p className="mt-0.5 text-xs text-[#5c6a7a]">このグループで利用する料金体系を選択してください。後から変更できます。</p>
              </div>

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
                          defaultValue="1000"
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
                          defaultValue="1500"
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
                    onChange={(e) => setHasAnnualFee(e.target.checked)}
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
                    onChange={(e) => setHasMonthlyFee(e.target.checked)}
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
                          placeholder="0"
                          className="border-[#dce3ea] pl-7"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                        defaultValue="10"
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
            <CardContent className="space-y-4 pt-5">
              <p className="text-sm font-semibold text-[#1a2332]">キャンセルポリシー</p>
              <div className="space-y-1.5">
                <Label htmlFor="cancellation_days">無料キャンセル期限</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cancellation_days"
                    name="cancellation_days"
                    type="number"
                    min="0"
                    max="30"
                    defaultValue="3"
                    className="w-20 border-[#dce3ea]"
                  />
                  <span className="text-sm text-[#5c6a7a]">日前まで無料キャンセル可</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 rounded-full border-[#dce3ea] text-[#5c6a7a]"
              style={{ minHeight: "48px" }}
            >
              ← 戻る
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]"
              style={{ minHeight: "48px" }}
            >
              {isPending ? "作成中..." : "グループを作成"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
