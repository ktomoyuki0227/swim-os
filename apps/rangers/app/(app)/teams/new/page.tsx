"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createTeam, uploadTeamImage } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"
import { BackLink } from "@/components/back-link"
import { PricingSimulatorButton } from "@/components/pricing-simulator"
import { PRACTICE_FREQUENCIES, PRACTICE_DAYS } from "@/types/database"

const STEPS = [
  { label: "基本情報" },
  { label: "詳細設定" },
  { label: "画像" },
  { label: "料金設定" },
]

interface FormData {
  name: string
  description: string
  is_recruiting: boolean
  activity_area: string
  main_pool: string
  practice_frequency: string
  practice_days: string[]
  contact_email: string
  contact_phone: string
}

interface ImageData {
  coverFile: File | null
  iconFile: File | null
  coverPreview: string | null
  iconPreview: string | null
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        const isLast = i === STEPS.length - 1
        return (
          <div key={i} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex w-10 shrink-0 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? "bg-[#005F8C] text-white"
                    : active
                    ? "border-2 border-[#005F8C] bg-white text-[#005F8C]"
                    : "border-2 border-[#dce3ea] bg-white text-[#8d99a8]"
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#005F8C]" : "text-[#8d99a8]"}`}>
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div className={`mb-4 h-0.5 flex-1 transition-colors ${done ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function NewTeamPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [step, setStep] = useState(0)

  // Form state
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    is_recruiting: true,
    activity_area: "",
    main_pool: "",
    practice_frequency: "",
    practice_days: [],
    contact_email: "",
    contact_phone: "",
  })

  // Image state
  const [images, setImages] = useState<ImageData>({
    coverFile: null, iconFile: null, coverPreview: null, iconPreview: null,
  })
  const [uploading, setUploading] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  // Fee state
  const [hasSessionFee, setHasSessionFee] = useState(true)
  const [hasAnnualFee, setHasAnnualFee] = useState(false)
  const [hasMonthlyFee, setHasMonthlyFee] = useState(false)
  const [hasPointCard, setHasPointCard] = useState(false)
  const [feeExempt, setFeeExempt] = useState(false)

  // シミュレーター適用ハンドラー
  const handleSimulatorApply = (values: { pointCardPrice?: number; monthlyFee?: number; annualFee?: number }) => {
    if (values.pointCardPrice !== undefined) {
      setHasPointCard(true)
      const el = document.getElementById("point_card_price") as HTMLInputElement | null
      if (el) { el.value = String(values.pointCardPrice) }
    }
    if (values.monthlyFee !== undefined) {
      setHasMonthlyFee(true)
      const el = document.getElementById("monthly_fee_amount") as HTMLInputElement | null
      if (el) { el.value = String(values.monthlyFee) }
    }
    if (values.annualFee !== undefined) {
      setHasAnnualFee(true)
      const el = document.getElementById("annual_fee_amount") as HTMLInputElement | null
      if (el) { el.value = String(values.annualFee) }
    }
  }

  // --- Handlers ---
  const handleStep1Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setForm((prev) => ({
      ...prev,
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || "",
    }))
    setStep(1)
  }

  const handleStep2Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setForm((prev) => ({
      ...prev,
      activity_area: (fd.get("activity_area") as string) || "",
      main_pool: (fd.get("main_pool") as string) || "",
      practice_frequency: (fd.get("practice_frequency") as string) || "",
      contact_email: (fd.get("contact_email") as string) || "",
      contact_phone: (fd.get("contact_phone") as string) || "",
    }))
    setStep(2)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "icon") => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (type === "cover") {
      setImages((prev) => ({ ...prev, coverFile: file, coverPreview: preview }))
    } else {
      setImages((prev) => ({ ...prev, iconFile: file, iconPreview: preview }))
    }
  }

  const handleStep3Next = async () => {
    setUploading(true)
    try {
      let newCoverUrl: string | null = null
      let newIconUrl: string | null = null
      if (images.coverFile) {
        const fd = new FormData()
        fd.append("file", images.coverFile)
        fd.append("type", "cover")
        const result = await uploadTeamImage(fd)
        if (result.error) { showToast(result.error, "error"); return }
        newCoverUrl = result.url ?? null
      }
      if (images.iconFile) {
        const fd = new FormData()
        fd.append("file", images.iconFile)
        fd.append("type", "icon")
        const result = await uploadTeamImage(fd)
        if (result.error) { showToast(result.error, "error"); return }
        newIconUrl = result.url ?? null
      }
      setCoverImageUrl(newCoverUrl)
      setIconImageUrl(newIconUrl)
      setStep(3)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const annualFeeVal = parseInt(fd.get("annual_fee_amount") as string)
    const monthlyFeeVal = parseInt(fd.get("monthly_fee_amount") as string)
    const pointCardPriceVal = parseInt(fd.get("point_card_price") as string)

    const payload = {
      name: form.name,
      description: form.description || undefined,
      activity_area: form.activity_area || undefined,
      is_recruiting: form.is_recruiting,
      practice_frequency: form.practice_frequency || undefined,
      practice_days: form.practice_days,
      main_pool: form.main_pool || undefined,
      cover_image_url: coverImageUrl || undefined,
      avatar_url: iconImageUrl || undefined,
      has_session_fee: hasSessionFee,
      has_annual_fee: hasAnnualFee,
      has_monthly_fee: hasMonthlyFee,
      has_point_card: hasPointCard,
      default_member_price: hasSessionFee ? (parseInt(fd.get("default_member_price") as string) || 0) : 0,
      default_guest_price: hasSessionFee ? (parseInt(fd.get("default_guest_price") as string) || 0) : 0,
      annual_fee_amount: hasAnnualFee ? (Number.isNaN(annualFeeVal) ? undefined : annualFeeVal) : undefined,
      monthly_fee_amount: hasMonthlyFee ? (Number.isNaN(monthlyFeeVal) ? undefined : monthlyFeeVal) : undefined,
      cancellation_days: parseInt(fd.get("cancellation_days") as string) || 3,
      point_card_count: hasPointCard ? (parseInt(fd.get("point_card_count") as string) || 10) : undefined,
      point_card_price: hasPointCard ? (Number.isNaN(pointCardPriceVal) ? undefined : pointCardPriceVal) : undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      fee_members_exempt_session: feeExempt,
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
    <div className="mx-auto max-w-xl space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <BackLink
          href="/teams"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
          aria-label="戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </BackLink>
        <h1 className="text-xl font-bold text-[#1a2332]">グループを作成</h1>
      </div>

      {/* ステップインジケーター */}
      <StepIndicator current={step} />

      {/* ===== Step 1: 基本情報 ===== */}
      {step === 0 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  グループ名 <span className="text-[#c0392b]">*</span>
                </Label>
                <Input
                  id="name" name="name"
                  placeholder="例: マウントリバー水泳クラブ"
                  defaultValue={form.name}
                  maxLength={100} required autoFocus
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">
                  グループの説明
                  <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
                </Label>
                <Textarea
                  id="description" name="description"
                  placeholder="活動内容や特徴を入力してください"
                  defaultValue={form.description}
                  rows={4} maxLength={2000}
                  className="resize-none border-[#dce3ea]"
                />
              </div>
              <div className="space-y-2">
                <Label>メンバー募集</Label>
                <div className="flex items-center gap-3 rounded-[10px] border border-[#dce3ea] p-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, is_recruiting: !prev.is_recruiting }))}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      form.is_recruiting ? "bg-[#005F8C]" : "bg-[#dce3ea]"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.is_recruiting ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                  <span className="text-sm font-medium text-[#1a2332]">
                    {form.is_recruiting ? "メンバー募集中" : "募集停止中"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: 48 }}>
            次へ →
          </Button>
        </form>
      )}

      {/* ===== Step 2: 詳細設定 ===== */}
      {step === 1 && (
        <form onSubmit={handleStep2Next} className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <div>
                <p className="text-sm font-semibold text-[#1a2332]">詳細設定</p>
                <p className="mt-0.5 text-xs text-[#5c6a7a]">すべて任意です。後から変更できます。</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activity_area">活動エリア</Label>
                <Input id="activity_area" name="activity_area" placeholder="例: 東京都渋谷区" defaultValue={form.activity_area} maxLength={100} className="border-[#dce3ea]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="main_pool">主な使用プール</Label>
                <Input id="main_pool" name="main_pool" placeholder="例: 渋谷区スポーツセンタープール" defaultValue={form.main_pool} maxLength={200} className="border-[#dce3ea]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="practice_frequency">練習ペース</Label>
                <select
                  id="practice_frequency" name="practice_frequency"
                  defaultValue={form.practice_frequency}
                  className="h-10 w-full rounded-md border border-[#dce3ea] bg-white px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
                >
                  <option value="">選択してください</option>
                  {PRACTICE_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>練習曜日<span className="ml-1 text-xs font-normal text-[#8d99a8]">（複数選択可）</span></Label>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_DAYS.map((day) => {
                    const checked = form.practice_days.includes(day)
                    return (
                      <button
                        key={day} type="button"
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          practice_days: checked ? prev.practice_days.filter((d) => d !== day) : [...prev.practice_days, day],
                        }))}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                          checked ? "border-[#005F8C] bg-[#005F8C] text-white" : "border-[#dce3ea] bg-white text-[#5c6a7a] hover:border-[#005F8C]/50"
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">問い合わせ用メールアドレス</Label>
                <Input id="contact_email" name="contact_email" type="email" placeholder="例：contact@example.com" defaultValue={form.contact_email} maxLength={254} className="border-[#dce3ea]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">問い合わせ用電話番号</Label>
                <Input id="contact_phone" name="contact_phone" type="tel" placeholder="09012345678" defaultValue={form.contact_phone} maxLength={20} className="border-[#dce3ea]" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-full border-[#dce3ea] text-[#5c6a7a]" style={{ minHeight: 48 }}>
              ← 戻る
            </Button>
            <Button type="submit" className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: 48 }}>
              次へ →
            </Button>
          </div>
          <button type="button" onClick={() => { setStep(2) }} className="w-full text-center text-sm text-[#005F8C] hover:underline" style={{ minHeight: 44 }}>
            スキップ →
          </button>
        </form>
      )}

      {/* ===== Step 3: 画像 ===== */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-5 pt-5">
              <div>
                <p className="text-sm font-semibold text-[#1a2332]">画像設定</p>
                <p className="mt-0.5 text-xs text-[#5c6a7a]">任意です。後から変更できます。</p>
              </div>

              {/* カバー画像 */}
              <div className="space-y-2">
                <Label>グループイメージ画像</Label>
                <div
                  className="relative w-full cursor-pointer overflow-hidden rounded-[10px] border border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:border-[#005F8C]/50"
                  style={{ aspectRatio: "16/5" }}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {images.coverPreview ? (
                    <Image src={images.coverPreview} alt="カバー画像プレビュー" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                      <span className="text-2xl">🖼</span>
                      <p className="text-xs text-[#8d99a8]">クリックして画像を選択</p>
                      <p className="text-xs text-[#8d99a8]">JPEG / PNG / WebP・5MB以下</p>
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} />
                {images.coverPreview && (
                  <button type="button" className="text-xs text-[#8d99a8] hover:text-[#5c6a7a]" onClick={() => setImages((prev) => ({ ...prev, coverFile: null, coverPreview: null }))}>
                    × 削除
                  </button>
                )}
              </div>

              {/* グループアイコン */}
              <div className="space-y-2">
                <Label>グループアイコン</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:border-[#005F8C]/50"
                    onClick={() => iconInputRef.current?.click()}
                  >
                    {images.iconPreview ? (
                      <Image src={images.iconPreview} alt="アイコンプレビュー" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><span className="text-2xl">🏊</span></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <button type="button" onClick={() => iconInputRef.current?.click()} className="rounded-[10px] border border-[#dce3ea] px-3 py-2 text-sm text-[#5c6a7a] transition-colors hover:border-[#005F8C]/50" style={{ minHeight: 44 }}>
                      画像を選択
                    </button>
                    <p className="mt-1 text-xs text-[#8d99a8]">JPEG / PNG / WebP・5MB以下</p>
                    {images.iconPreview && (
                      <button type="button" className="mt-1 text-xs text-[#8d99a8] hover:text-[#5c6a7a]" onClick={() => setImages((prev) => ({ ...prev, iconFile: null, iconPreview: null }))}>
                        × 削除
                      </button>
                    )}
                  </div>
                </div>
                <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileSelect(e, "icon")} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full border-[#dce3ea] text-[#5c6a7a]" style={{ minHeight: 48 }}>
              ← 戻る
            </Button>
            <Button type="button" disabled={uploading} onClick={handleStep3Next} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73] disabled:opacity-40" style={{ minHeight: 48 }}>
              {uploading ? "アップロード中..." : "次へ →"}
            </Button>
          </div>
          <button type="button" onClick={() => { setStep(3) }} className="w-full text-center text-sm text-[#005F8C] hover:underline" style={{ minHeight: 44 }}>
            スキップ →
          </button>
        </div>
      )}

      {/* ===== Step 4: 料金設定（2セクション構成） ===== */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── セクション1: セッション参加費 ── */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">💰</span>
              <h3 className="text-sm font-semibold text-[#1a2332]">セッション参加費</h3>
              <PricingSimulatorButton memberPrice={1000} onApply={handleSimulatorApply} />
            </div>
            <div className="space-y-2">
              {/* 参加費トグル */}
              <div className={`overflow-hidden rounded-[14px] border transition-colors ${hasSessionFee ? "border-[#005F8C]/30" : "border-[#dce3ea]"}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1a2332]">参加費を設定する</p>
                    <p className="text-xs text-[#5c6a7a]">練習・イベントごとに料金を徴収</p>
                  </div>
                  <button type="button" onClick={() => setHasSessionFee(!hasSessionFee)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hasSessionFee ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasSessionFee ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {hasSessionFee && (
                  <div className="border-t border-[#dce3ea]/50 bg-[#f2f7fa]/50 px-4 py-3 space-y-3">
                    <div className="grid gap-3 grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="default_member_price" className="text-xs">メンバー料金</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                          <Input id="default_member_price" name="default_member_price" type="number" min="0" step="100" defaultValue="1000" className="border-[#dce3ea] pl-7" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="default_guest_price" className="text-xs">ゲスト料金</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                          <Input id="default_guest_price" name="default_guest_price" type="number" min="0" step="100" defaultValue="1500" className="border-[#dce3ea] pl-7" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cancellation_days" className="text-xs">キャンセル期限</Label>
                      <div className="flex items-center gap-2">
                        <Input id="cancellation_days" name="cancellation_days" type="number" min="0" max="30" defaultValue="3" className="w-16 border-[#dce3ea]" />
                        <span className="text-xs text-[#5c6a7a]">日前まで無料キャンセル可</span>
                      </div>
                    </div>

                    {/* 回数券（参加費内のチェックボックス） */}
                    <div className="border-t border-[#dce3ea]/30 pt-3">
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={hasPointCard}
                          onChange={(e) => setHasPointCard(e.target.checked)}
                          className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]"
                        />
                        <div>
                          <p className="text-xs font-medium text-[#1a2332]">回数券での支払いを受け付ける</p>
                        </div>
                      </label>
                      {hasPointCard && (
                        <div className="mt-2 ml-6 grid gap-3 grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor="point_card_count" className="text-xs">1枚の回数</Label>
                            <Input id="point_card_count" name="point_card_count" type="number" min="1" max="100" defaultValue="10" className="border-[#dce3ea]" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="point_card_price" className="text-xs">販売価格（任意）</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                              <Input id="point_card_price" name="point_card_price" type="number" min="0" step="100" placeholder="未設定" className="border-[#dce3ea] pl-7" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 区切り線 ── */}
          <div className="h-px bg-[#e8edf2]" />

          {/* ── セクション2: メンバーシップ ── */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-base">👥</span>
              <h3 className="text-sm font-semibold text-[#1a2332]">メンバーシップ</h3>
              <PricingSimulatorButton memberPrice={1000} onApply={handleSimulatorApply} />
            </div>
            <p className="mb-2 text-xs text-[#5c6a7a]">継続的な会費を設定する場合に有効にしてください</p>
            <div className="space-y-2">
              {/* 年会費 */}
              <div className={`overflow-hidden rounded-[14px] border transition-colors ${hasAnnualFee ? "border-[#005F8C]/30" : "border-[#dce3ea]"}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1a2332]">年会費</p>
                    <p className="text-xs text-[#5c6a7a]">年1回の会費を徴収</p>
                  </div>
                  <button type="button" onClick={() => { setHasAnnualFee(!hasAnnualFee); if (hasAnnualFee && !hasMonthlyFee) setFeeExempt(false) }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hasAnnualFee ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasAnnualFee ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {hasAnnualFee && (
                  <div className="border-t border-[#dce3ea]/50 bg-[#f2f7fa]/50 px-4 py-3">
                    <div className="space-y-1">
                      <Label htmlFor="annual_fee_amount" className="text-xs">金額</Label>
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                        <Input id="annual_fee_amount" name="annual_fee_amount" type="number" min="0" step="100" placeholder="0" className="border-[#dce3ea] pl-7" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 月謝 */}
              <div className={`overflow-hidden rounded-[14px] border transition-colors ${hasMonthlyFee ? "border-[#005F8C]/30" : "border-[#dce3ea]"}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1a2332]">月謝</p>
                    <p className="text-xs text-[#5c6a7a]">毎月の月謝を徴収</p>
                  </div>
                  <button type="button" onClick={() => { setHasMonthlyFee(!hasMonthlyFee); if (hasMonthlyFee && !hasAnnualFee) setFeeExempt(false) }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hasMonthlyFee ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasMonthlyFee ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {hasMonthlyFee && (
                  <div className="border-t border-[#dce3ea]/50 bg-[#f2f7fa]/50 px-4 py-3">
                    <div className="space-y-1">
                      <Label htmlFor="monthly_fee_amount" className="text-xs">金額</Label>
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                        <Input id="monthly_fee_amount" name="monthly_fee_amount" type="number" min="0" step="100" placeholder="0" className="border-[#dce3ea] pl-7" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 会員特典: 参加費免除 */}
              {(hasAnnualFee || hasMonthlyFee) && hasSessionFee && (
                <div className={`overflow-hidden rounded-[14px] border transition-colors ${feeExempt ? "border-[#0f8a4f]/30 bg-[#eaf7f0]/30" : "border-[#dce3ea]"}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a2332]">会員特典: 参加費免除</p>
                      <p className="text-xs text-[#5c6a7a]">会費を払っているメンバーはセッション参加費が無料に</p>
                    </div>
                    <button type="button" onClick={() => setFeeExempt(!feeExempt)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${feeExempt ? "bg-[#0f8a4f]" : "bg-[#dce3ea]"}`}>
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${feeExempt ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-full border-[#dce3ea] text-[#5c6a7a]" style={{ minHeight: 48 }}>
              ← 戻る
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: 48 }}>
              {isPending ? "作成中..." : "グループを作成"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
