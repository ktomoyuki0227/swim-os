"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateTeam } from "@/actions/teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/toast"

interface Team {
  id: string
  name: string
  description: string | null
  default_member_price: number | null
  default_guest_price: number | null
  annual_fee_amount: number | null
  monthly_fee_amount: number | null
  cancellation_days: number | null
  point_card_count: number | null
  point_card_price: number | null
}

interface EditTeamFormProps {
  team: Team
}

export function EditTeamForm({ team }: EditTeamFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const payload = {
      name: data.get("name") as string,
      description: (data.get("description") as string) || undefined,
      default_member_price: parseInt(data.get("default_member_price") as string) || 0,
      default_guest_price: parseInt(data.get("default_guest_price") as string) || 0,
      annual_fee_amount: parseInt(data.get("annual_fee_amount") as string) || undefined,
      monthly_fee_amount: parseInt(data.get("monthly_fee_amount") as string) || undefined,
      cancellation_days: parseInt(data.get("cancellation_days") as string) || 3,
      point_card_count: parseInt(data.get("point_card_count") as string) || 10,
      point_card_price: parseInt(data.get("point_card_price") as string) || undefined,
    }

    startTransition(async () => {
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
              <Label htmlFor="name">グループ名 <span className="text-[#E8614D]">*</span></Label>
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
          </CardContent>
        </Card>

        {/* 料金設定 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">料金設定（デフォルト値）</CardTitle>
            <p className="text-xs text-[#5c6a7a]">セッション作成時に自動入力されます。個別に変更可能です。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-1.5">
                <Label htmlFor="annual_fee_amount">年会費</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                  <Input
                    id="annual_fee_amount"
                    name="annual_fee_amount"
                    type="number"
                    min="0"
                    step="100"
                    defaultValue={team.annual_fee_amount ?? ""}
                    placeholder="未設定"
                    className="border-[#dce3ea] pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly_fee_amount">月謝</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c6a7a]">¥</span>
                  <Input
                    id="monthly_fee_amount"
                    name="monthly_fee_amount"
                    type="number"
                    min="0"
                    step="100"
                    defaultValue={team.monthly_fee_amount ?? ""}
                    placeholder="未設定"
                    className="border-[#dce3ea] pl-7"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 回数券設定 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2332]">回数券（スタンプカード）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="point_card_price">回数券の価格</Label>
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
            disabled={isPending}
            className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]"
            style={{ minHeight: "48px" }}
          >
            {isPending ? "保存中..." : "変更を保存"}
          </Button>
        </div>
      </form>
    </div>
  )
}
