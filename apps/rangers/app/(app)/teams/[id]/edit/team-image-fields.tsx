import type { RefObject } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface TeamImageFieldsProps {
  coverPreview: string | null
  iconPreview: string | null
  coverInputRef: RefObject<HTMLInputElement | null>
  iconInputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "icon") => void
  onRemoveCover: () => void
  onRemoveIcon: () => void
}

/** チーム編集フォームの画像設定(カバー画像・アイコン)カード */
export function TeamImageFields({
  coverPreview,
  iconPreview,
  coverInputRef,
  iconInputRef,
  onFileSelect,
  onRemoveCover,
  onRemoveIcon,
}: TeamImageFieldsProps) {
  return (
    <Card className="border-[#dce3ea]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1a2332]">画像設定</CardTitle>
        <p className="text-xs text-[#475569]">変更したい画像のみ選択してください。</p>
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
                sizes="(max-width: 640px) 100vw, 640px"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                <span className="text-2xl">🖼</span>
                <p className="text-xs text-[#64748b]">クリックして画像を選択</p>
                <p className="text-xs text-[#64748b]">JPEG / PNG / WebP・5MB以下</p>
              </div>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onFileSelect(e, "cover")}
          />
          {coverPreview && (
            <button
              type="button"
              className="text-xs text-[#c0392b] hover:underline"
              onClick={onRemoveCover}
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
                  sizes="80px"
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
                className="rounded-lg border border-[#dce3ea] px-3 py-2 text-sm text-[#475569] hover:border-[#005F8C]/50 transition-colors"
                style={{ minHeight: "44px" }}
              >
                画像を選択
              </button>
              <p className="mt-1 text-xs text-[#64748b]">JPEG / PNG / WebP・5MB以下</p>
              {iconPreview && (
                <button
                  type="button"
                  className="mt-1 text-xs text-[#c0392b] hover:underline"
                  onClick={onRemoveIcon}
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
            onChange={(e) => onFileSelect(e, "icon")}
          />
        </div>
      </CardContent>
    </Card>
  )
}
