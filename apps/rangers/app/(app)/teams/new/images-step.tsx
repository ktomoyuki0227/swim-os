"use client"

import { useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ImageData } from "./types"

interface ImagesStepProps {
  typeLabel: string
  images: ImageData
  uploading: boolean
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "icon") => void
  onRemoveCover: () => void
  onRemoveIcon: () => void
  onNext: () => void
  onBack: () => void
}

export function ImagesStep({
  typeLabel,
  images,
  uploading,
  onFileSelect,
  onRemoveCover,
  onRemoveIcon,
  onNext,
  onBack,
}: ImagesStepProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <Card className="border-[#dce3ea]">
        <CardContent className="space-y-5 pt-5">
          <div>
            <p className="text-sm font-semibold text-[#1a2332]">画像設定</p>
            <p className="mt-0.5 text-xs text-[#475569]">任意です。後から変更できます。</p>
          </div>

          {/* カバー画像 */}
          <div className="space-y-2">
            <Label>{typeLabel}イメージ画像</Label>
            <div
              className="relative w-full cursor-pointer overflow-hidden rounded-[10px] border border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:border-[#005F8C]/50"
              style={{ aspectRatio: "16/5" }}
              onClick={() => coverInputRef.current?.click()}
            >
              {images.coverPreview ? (
                <Image src={images.coverPreview} alt="カバー画像プレビュー" fill className="object-cover" sizes="(max-width: 640px) 100vw, 640px" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                  <span className="text-2xl">🖼</span>
                  <p className="text-xs text-[#64748b]">クリックして画像を選択</p>
                  <p className="text-xs text-[#64748b]">JPEG / PNG / WebP・5MB以下</p>
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFileSelect(e, "cover")} />
            {images.coverPreview && (
              <button type="button" className="text-xs text-[#64748b] hover:text-[#475569]" onClick={onRemoveCover}>
                × 削除
              </button>
            )}
          </div>

          {/* アイコン */}
          <div className="space-y-2">
            <Label>{typeLabel}アイコン</Label>
            <div className="flex items-center gap-4">
              <div
                className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:border-[#005F8C]/50"
                onClick={() => iconInputRef.current?.click()}
              >
                {images.iconPreview ? (
                  <Image src={images.iconPreview} alt="アイコンプレビュー" fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><span className="text-2xl">🏊</span></div>
                )}
              </div>
              <div className="flex-1">
                <button type="button" onClick={() => iconInputRef.current?.click()} className="rounded-[10px] border border-[#dce3ea] px-3 py-2 text-sm text-[#475569] transition-colors hover:border-[#005F8C]/50" style={{ minHeight: 44 }}>
                  画像を選択
                </button>
                <p className="mt-1 text-xs text-[#64748b]">JPEG / PNG / WebP・5MB以下</p>
                {images.iconPreview && (
                  <button type="button" className="mt-1 text-xs text-[#64748b] hover:text-[#475569]" onClick={onRemoveIcon}>
                    × 削除
                  </button>
                )}
              </div>
            </div>
            <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFileSelect(e, "icon")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full border-[#dce3ea] text-[#475569]" style={{ minHeight: 48 }}>
          ← 戻る
        </Button>
        <Button type="button" disabled={uploading} onClick={onNext} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73] disabled:opacity-40" style={{ minHeight: 48 }}>
          {uploading ? "アップロード中..." : "次へ →"}
        </Button>
      </div>
    </div>
  )
}
