import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "./types"

interface StepPricingProps {
  form: FormData
  set: (key: keyof FormData, value: string | boolean) => void
}

export function StepPricing({ form, set }: StepPricingProps) {
  return (
    <Card className="border-[#dce3ea]">
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="member_price">メンバー参加費</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
              <Input
                id="member_price"
                type="number"
                min="0"
                step="100"
                value={form.member_price}
                onChange={(e) => set("member_price", e.target.value)}
                className="border-[#dce3ea] pl-7"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest_price">ゲスト参加費</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
              <Input
                id="guest_price"
                type="number"
                min="0"
                step="100"
                value={form.guest_price}
                onChange={(e) => set("guest_price", e.target.value)}
                className={`border-[#dce3ea] pl-7 transition-opacity ${!form.is_external ? "opacity-40" : ""}`}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => set("allow_point_card", !form.allow_point_card)}
          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
            form.allow_point_card
              ? "border-[#005F8C]/30 bg-[#e8f2f8] text-[#005F8C]"
              : "border-[#dce3ea] bg-[#f2f7fa] text-[#475569]"
          }`}
        >
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            form.allow_point_card ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"
          }`}>
            {form.allow_point_card && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          回数券での参加を許可する
        </button>

        <button
          type="button"
          onClick={() => set("is_external", !form.is_external)}
          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
            form.is_external
              ? "border-[#005F8C]/30 bg-[#e8f2f8] text-[#005F8C]"
              : "border-[#dce3ea] bg-[#f2f7fa] text-[#475569]"
          }`}
        >
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            form.is_external ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"
          }`}>
            {form.is_external && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          外部公開する（メンバー以外も参加可能）
        </button>
      </CardContent>
    </Card>
  )
}
