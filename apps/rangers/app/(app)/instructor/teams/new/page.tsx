"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createTeam } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"

interface Step1Data {
  name: string
  description: string
}

export default function NewTeamPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [step, setStep] = useState<1 | 2>(1)
  const [step1, setStep1] = useState<Step1Data>({ name: "", description: "" })

  const handleStep1Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    setStep1({
      name: data.get("name") as string,
      description: (data.get("description") as string) || "",
    })
    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const payload = {
      name: step1.name,
      description: step1.description || undefined,
      default_member_price: parseInt(data.get("default_member_price") as string) || 0,
      default_guest_price: parseInt(data.get("default_guest_price") as string) || 0,
      annual_fee_amount: parseInt(data.get("annual_fee_amount") as string) || undefined,
      monthly_fee_amount: parseInt(data.get("monthly_fee_amount") as string) || undefined,
      cancellation_days: parseInt(data.get("cancellation_days") as string) || 3,
      point_card_count: parseInt(data.get("point_card_count") as string) || 10,
      point_card_price: parseInt(data.get("point_card_price") as string) || undefined,
    }

    startTransition(async () => {
      const result = await createTeam(payload)
      if (result.error) {
        showToast(result.error, "error")
      } else if (result.data) {
        router.refresh()
        router.push(`/instructor/teams/${result.data.id}`)
      }
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/instructor/teams" className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
          ← チーム管理
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[#1a2332]">チームを作成</h1>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
            "bg-[#005F8C] text-white"
          }`}
        >
          1
        </div>
        <div
          className={`h-0.5 flex-1 transition-colors ${
            step === 2 ? "bg-[#005F8C]" : "bg-[#dce3ea]"
          }`}
        />
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
            step === 2 ? "bg-[#005F8C] text-white" : "bg-[#edf0f4] text-[#5c6a7a]"
          }`}
        >
          2
        </div>
      </div>

      {/* Step 1: 基本情報 */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  チーム名 <span className="text-[#E8614D]">*</span>
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
                  チームの説明
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

      {/* Step 2: 料金・ポリシー設定 */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-4">
          {/* チーム名の確認表示 */}
          <div className="rounded-xl bg-[#f2f7fa] px-4 py-3">
            <p className="text-xs text-[#5c6a7a]">チーム名</p>
            <p className="font-medium text-[#1a2332]">{step1.name}</p>
          </div>

          {/* 料金設定 */}
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <div>
                <p className="text-sm font-semibold text-[#1a2332]">料金設定</p>
                <p className="mt-0.5 text-xs text-[#5c6a7a]">セッション作成時のデフォルト値。後から変更できます。</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
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
                <div className="space-y-1.5">
                  <Label htmlFor="annual_fee_amount">
                    年会費
                    <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                    <Input
                      id="annual_fee_amount"
                      name="annual_fee_amount"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="未設定"
                      className="border-[#dce3ea] pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monthly_fee_amount">
                    月謝
                    <span className="ml-1 text-xs font-normal text-[#8d99a8]">（任意）</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                    <Input
                      id="monthly_fee_amount"
                      name="monthly_fee_amount"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="未設定"
                      className="border-[#dce3ea] pl-7"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 回数券 + キャンセルポリシー */}
          <Card className="border-[#dce3ea]">
            <CardContent className="space-y-4 pt-5">
              <p className="text-sm font-semibold text-[#1a2332]">回数券 / キャンセルポリシー</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="point_card_count">回数券 - 1枚の回数</Label>
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
              onClick={() => setStep(1)}
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
              {isPending ? "作成中..." : "チームを作成"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
