"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PricingSimulatorButton } from "@/components/pricing-simulator"
import type { FeeFieldsForm } from "./types"

interface FeeFieldsProps {
  form: FeeFieldsForm
  onChange: (next: FeeFieldsForm) => void
  simulatorMemberPrice: number
}

export function FeeFields({ form, onChange, simulatorMemberPrice }: FeeFieldsProps) {
  // シミュレーターの適用値をそのままcontrolled stateに反映する
  // (以前はgetElementByIdでDOM要素のvalueを直接書き換えていたが、Reactの状態管理を
  // バイパスするアンチパターンだったためcontrolled inputに統一した)
  const handleSimulatorApply = (values: { pointCardPrice?: number; monthlyFee?: number; annualFee?: number }) => {
    onChange({
      ...form,
      ...(values.pointCardPrice !== undefined ? { hasPointCard: true, pointCardPrice: String(values.pointCardPrice) } : {}),
      ...(values.monthlyFee !== undefined ? { hasMonthlyFee: true, monthlyFeeAmount: String(values.monthlyFee) } : {}),
      ...(values.annualFee !== undefined ? { hasAnnualFee: true, annualFeeAmount: String(values.annualFee) } : {}),
    })
  }

  return (
    <>
      {/* ── メンバーシップ ── */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-base">👥</span>
          <h3 className="text-sm font-semibold text-[#1a2332]">メンバーシップ</h3>
          <PricingSimulatorButton memberPrice={simulatorMemberPrice} onApply={handleSimulatorApply} />
        </div>
        <p className="mb-2 text-xs text-[#475569]">継続的な会費を設定する場合に有効にしてください</p>
        <div className="space-y-2">
          <div className={`overflow-hidden rounded-[14px] border transition-colors ${form.hasAnnualFee ? "border-[#005F8C]/30" : "border-[#dce3ea]"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a2332]">年会費</p>
                <p className="text-xs text-[#475569]">年1回の会費を徴収</p>
              </div>
              <button type="button" onClick={() => onChange({ ...form, hasAnnualFee: !form.hasAnnualFee })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.hasAnnualFee ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.hasAnnualFee ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {form.hasAnnualFee && (
              <div className="border-t border-[#dce3ea]/50 bg-[#f2f7fa]/50 px-4 py-3">
                <div className="space-y-1">
                  <Label htmlFor="annual_fee_amount" className="text-xs">金額</Label>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
                    <Input
                      id="annual_fee_amount" name="annual_fee_amount" type="number" min="0" step="100" placeholder="0"
                      value={form.annualFeeAmount}
                      onChange={(e) => onChange({ ...form, annualFeeAmount: e.target.value })}
                      className="border-[#dce3ea] pl-7"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`overflow-hidden rounded-[14px] border transition-colors ${form.hasMonthlyFee ? "border-[#005F8C]/30" : "border-[#dce3ea]"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a2332]">月謝</p>
                <p className="text-xs text-[#475569]">毎月の月謝を徴収</p>
              </div>
              <button type="button" onClick={() => onChange({ ...form, hasMonthlyFee: !form.hasMonthlyFee })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.hasMonthlyFee ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.hasMonthlyFee ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {form.hasMonthlyFee && (
              <div className="border-t border-[#dce3ea]/50 bg-[#f2f7fa]/50 px-4 py-3">
                <div className="space-y-1">
                  <Label htmlFor="monthly_fee_amount" className="text-xs">金額</Label>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
                    <Input
                      id="monthly_fee_amount" name="monthly_fee_amount" type="number" min="0" step="100" placeholder="0"
                      value={form.monthlyFeeAmount}
                      onChange={(e) => onChange({ ...form, monthlyFeeAmount: e.target.value })}
                      className="border-[#dce3ea] pl-7"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e8edf2]" />

      {/* ── セッション参加費 ── */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base">💰</span>
          <h3 className="text-sm font-semibold text-[#1a2332]">セッション参加費</h3>
          <PricingSimulatorButton memberPrice={simulatorMemberPrice} onApply={handleSimulatorApply} />
        </div>
        <div className="space-y-2">
          <div className={`overflow-hidden rounded-[14px] border transition-colors ${form.hasSessionFee ? "border-[#005F8C]/30" : "border-[#dce3ea]"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a2332]">参加費を設定する</p>
                <p className="text-xs text-[#475569]">練習・イベントごとに料金を徴収</p>
              </div>
              <button type="button" onClick={() => onChange({ ...form, hasSessionFee: !form.hasSessionFee })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.hasSessionFee ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.hasSessionFee ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {form.hasSessionFee && (
              <div className="border-t border-[#dce3ea]/50 bg-[#f2f7fa]/50 px-4 py-3 space-y-3">
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="default_member_price" className="text-xs">メンバー料金</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
                      <Input
                        id="default_member_price" name="default_member_price" type="number" min="0" step="100"
                        value={form.defaultMemberPrice}
                        onChange={(e) => onChange({ ...form, defaultMemberPrice: e.target.value })}
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="default_guest_price" className="text-xs">ゲスト料金</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
                      <Input
                        id="default_guest_price" name="default_guest_price" type="number" min="0" step="100"
                        value={form.defaultGuestPrice}
                        onChange={(e) => onChange({ ...form, defaultGuestPrice: e.target.value })}
                        className="border-[#dce3ea] pl-7"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#dce3ea]/30 pt-3 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input type="checkbox" checked={form.hasPointCard} onChange={(e) => onChange({ ...form, hasPointCard: e.target.checked })} className="h-4 w-4 rounded border-[#dce3ea] accent-[#005F8C]" />
                    <p className="text-xs font-medium text-[#1a2332]">回数券での支払いを受け付ける</p>
                  </label>
                  {form.hasPointCard && (
                    <div className="ml-6 grid gap-3 grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="point_card_count" className="text-xs">1枚の回数</Label>
                        <Input
                          id="point_card_count" name="point_card_count" type="number" min="1" max="100"
                          value={form.pointCardCount}
                          onChange={(e) => onChange({ ...form, pointCardCount: e.target.value })}
                          className="border-[#dce3ea]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="point_card_price" className="text-xs">販売価格（任意）</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
                          <Input
                            id="point_card_price" name="point_card_price" type="number" min="0" step="100" placeholder="未設定"
                            value={form.pointCardPrice}
                            onChange={(e) => onChange({ ...form, pointCardPrice: e.target.value })}
                            className="border-[#dce3ea] pl-7"
                          />
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
    </>
  )
}
