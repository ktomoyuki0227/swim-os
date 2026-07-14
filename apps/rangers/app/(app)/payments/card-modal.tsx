"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { CreditCard, CheckCircle, X } from "lucide-react"
import { UpdateCardForm } from "./update-card-form"

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  jcb: "JCB",
  discover: "Discover",
  diners: "Diners Club",
  unionpay: "UnionPay",
  unknown: "カード",
}

interface CardDetails {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface CardModalProps {
  cardDetails: CardDetails | null
  hasCard: boolean
}

export function CardModal({ cardDetails, hasCard }: CardModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* クレジットカードアイコンボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{ minHeight: "44px", minWidth: "44px" }}
        className={`relative flex items-center justify-center rounded-full border bg-white transition-colors hover:border-[#005F8C] hover:text-[#005F8C] ${
          hasCard
            ? "border-[#dce3ea] text-[#5c6a7a]"
            : "border-[#b8860b] text-[#b8860b]"
        }`}
        aria-label="クレジットカード管理"
      >
        <CreditCard className="h-5 w-5" />
        {/* カード未登録時の警告ドット */}
        {!hasCard && (
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#b8860b]" />
        )}
      </button>

      {/* ボトムシートモーダル（PageTransition の transform 影響を避けるため portal で描画） */}
      {mounted && isOpen && createPortal(
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* シートパネル */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] bg-white shadow-2xl">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#dce3ea]" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#005F8C]" />
                <h3 className="text-base font-semibold text-[#1a2332]">クレジットカード</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f7fa] text-[#5c6a7a] hover:bg-[#e0edf5]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* コンテンツ（高さ超過時にスクロール可能） */}
            <div className="space-y-4 overflow-y-auto px-5 pb-10" style={{ maxHeight: "calc(85vh - 80px)" }}>
              {/* 登録済みカード情報 */}
              {cardDetails ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-[#dce3ea] bg-[#f2f7fa] px-4 py-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-[#0f8a4f]" />
                  <div>
                    <p className="text-sm font-medium text-[#1a2332]">
                      {CARD_BRAND_LABELS[cardDetails.brand] ?? cardDetails.brand}{" "}
                      <span className="font-mono">•••• {cardDetails.last4}</span>
                    </p>
                    <p className="text-xs text-[#5c6a7a]">
                      有効期限: {String(cardDetails.expMonth).padStart(2, "0")}/{cardDetails.expYear}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#5c6a7a]">
                  クレジットカードが登録されていません。グループの参加費・年会費・月謝の支払いに使用されます。
                </p>
              )}

              {/* カード登録・変更フォーム */}
              <UpdateCardForm hasCard={hasCard} />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
