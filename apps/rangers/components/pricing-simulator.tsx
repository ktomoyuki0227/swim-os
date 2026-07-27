"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMounted } from "@/hooks/use-mounted"

interface ApplyValues {
  pointCardPrice?: number
  monthlyFee?: number
  annualFee?: number
}

interface PricingSimulatorProps {
  memberPrice: number
  onApply?: (values: ApplyValues) => void
}

export function PricingSimulatorButton({ memberPrice, onApply }: PricingSimulatorProps) {
  const [open, setOpen] = useState(false)
  const mounted = useMounted()

  // 入力値を親側で保持（ポップアップを閉じても残る）
  const [savedInputs, setSavedInputs] = useState({
    avgAttendance: "",
    cardSessions: "",
    inputMemberPrice: memberPrice > 0 ? String(memberPrice) : "",
  })

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleEsc)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
        aria-label="料金シミュレーター"
        title="料金シミュレーター"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {mounted && open && createPortal(
        <PricingSimulatorModal
          initialInputs={savedInputs}
          onInputsChange={setSavedInputs}
          onClose={() => setOpen(false)}
          onApply={onApply ? (values) => { onApply(values); setOpen(false) } : undefined}
        />,
        document.body
      )}
    </>
  )
}

interface SimInputs {
  avgAttendance: string
  cardSessions: string
  inputMemberPrice: string
}

function PricingSimulatorModal({ initialInputs, onInputsChange, onClose, onApply }: {
  initialInputs: SimInputs
  onInputsChange: (inputs: SimInputs) => void
  onClose: () => void
  onApply?: (values: ApplyValues) => void
}) {
  const [avgAttendance, setAvgAttendance] = useState(initialInputs.avgAttendance)
  const [cardSessions, setCardSessions] = useState(initialInputs.cardSessions)
  const [inputMemberPrice, setInputMemberPrice] = useState(initialInputs.inputMemberPrice)

  // 入力値が変わるたびに親に保存
  useEffect(() => {
    onInputsChange({ avgAttendance, cardSessions, inputMemberPrice })
  }, [avgAttendance, cardSessions, inputMemberPrice, onInputsChange])

  const price = parseInt(inputMemberPrice) || 0
  const avg = parseInt(avgAttendance) || 0
  const cards = parseInt(cardSessions) || 10

  const hasResults = price > 0 && avg > 0

  // 計算
  const pointCardPrice = hasResults ? Math.round((cards * price * 0.8) / 100) * 100 : 0
  const pointCardPerSession = cards > 0 && pointCardPrice > 0 ? Math.round(pointCardPrice / cards) : 0
  const monthlySuggestion = hasResults ? Math.round((avg * price * 0.8) / 100) * 100 : 0
  const annualSuggestion = monthlySuggestion > 0 ? Math.round((monthlySuggestion * 10) / 1000) * 1000 : 0
  const breakeven = monthlySuggestion > 0 && price > 0 ? Math.ceil(monthlySuggestion / price) : 0

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center sm:justify-center"
      style={{ minHeight: "100dvh" }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative z-[400] w-full max-w-md rounded-t-[14px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:rounded-[14px]"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-[#e8edf2] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h3 className="text-base font-semibold text-[#1a2332]">料金シミュレーター</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#475569] transition-colors hover:bg-[#f2f7fa]"
            aria-label="閉じる"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="max-h-[70dvh] overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          <p className="text-xs text-[#475569]">チームの情報を入力すると、各料金の目安を自動計算します。</p>

          {/* 入力フォーム */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">メンバー1回あたりの参加費</Label>
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#475569]">¥</span>
                <Input
                  type="number" min="0" step="100"
                  placeholder="1000"
                  value={inputMemberPrice}
                  onChange={(e) => setInputMemberPrice(e.target.value)}
                  className="border-[#dce3ea] pl-7"
                />
              </div>
            </div>
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">平均参加回数/月</Label>
                <Input
                  type="number" min="1" max="30" placeholder="3"
                  value={avgAttendance}
                  onChange={(e) => setAvgAttendance(e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">回数券のスタンプ枚数</Label>
                <Input
                  type="number" min="1" max="50"
                  placeholder="10"
                  value={cardSessions}
                  onChange={(e) => setCardSessions(e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
            </div>
          </div>

          {/* 計算結果 */}
          {hasResults && (
            <div className="space-y-3">
              <div className="h-px bg-[#e8edf2]" />

              {/* 回数券 */}
              <div className="rounded-[10px] bg-[#f2f7fa] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#1a2332]">🎫 回数券（{cards}回・20%割引）</p>
                  {onApply && (
                    <button
                      type="button"
                      onClick={() => onApply({ pointCardPrice })}
                      className="rounded-full bg-[#005F8C] px-2.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#004E73]"
                    >
                      適用
                    </button>
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#475569]">おすすめ価格</span>
                  <span className="text-lg font-bold text-[#005F8C]">¥{pointCardPrice.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-[#64748b]">
                  1回あたり ¥{pointCardPerSession.toLocaleString()}（都度払い ¥{price.toLocaleString()} より ¥{(price - pointCardPerSession).toLocaleString()} お得）
                </p>
              </div>

              {/* 月謝 */}
              <div className="rounded-[10px] bg-[#f2f7fa] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#1a2332]">💳 月謝（参加費免除の場合）</p>
                  {onApply && (
                    <button
                      type="button"
                      onClick={() => onApply({ monthlyFee: monthlySuggestion })}
                      className="rounded-full bg-[#005F8C] px-2.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#004E73]"
                    >
                      適用
                    </button>
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#475569]">おすすめ価格</span>
                  <span className="text-lg font-bold text-[#005F8C]">¥{monthlySuggestion.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-[#64748b]">
                  月{avg}回参加 × ¥{price.toLocaleString()} = ¥{(avg * price).toLocaleString()} の20%割引
                </p>
                {breakeven > 0 && (
                  <p className="text-[10px] font-medium text-[#0f8a4f]">
                    → 月{breakeven}回以上参加するメンバーは月謝の方がお得
                  </p>
                )}
              </div>

              {/* 年会費 */}
              <div className="rounded-[10px] bg-[#f2f7fa] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#1a2332]">📅 年会費（月謝の10ヶ月分）</p>
                  {onApply && (
                    <button
                      type="button"
                      onClick={() => onApply({ annualFee: annualSuggestion })}
                      className="rounded-full bg-[#005F8C] px-2.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#004E73]"
                    >
                      適用
                    </button>
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#475569]">おすすめ価格</span>
                  <span className="text-lg font-bold text-[#005F8C]">¥{annualSuggestion.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-[#64748b]">
                  月謝 ¥{monthlySuggestion.toLocaleString()} × 10ヶ月（2ヶ月分お得）
                </p>
              </div>

              {/* 一括適用 */}
              {onApply && (
                <button
                  type="button"
                  onClick={() => onApply({ pointCardPrice, monthlyFee: monthlySuggestion, annualFee: annualSuggestion })}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#005F8C] px-4 py-2 text-sm font-semibold text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
                  style={{ minHeight: 44 }}
                >
                  すべて適用
                </button>
              )}

              <p className="text-[10px] text-[#64748b] text-center">※ あくまで目安です。チームの運営方針に合わせて調整してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
