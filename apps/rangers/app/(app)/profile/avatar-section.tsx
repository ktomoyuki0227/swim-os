"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface AvatarSectionProps {
  isLoading: boolean
  isAvatarPending: boolean
  name: string
  avatarUrl: string | null
  displayUrl: string | null
  completeness: number
  remainingCount: number
  onFileSelected: (file: File) => void
  onDelete: () => void
}

export function AvatarSection({
  isLoading,
  isAvatarPending,
  name,
  avatarUrl,
  displayUrl,
  completeness,
  remainingCount,
  onFileSelected,
  onDelete,
}: AvatarSectionProps) {
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // アバターメニューの外側クリックで閉じる
  useEffect(() => {
    if (!avatarMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [avatarMenuOpen])

  const initials = name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarMenuOpen(false)
    onFileSelected(file)
  }

  return (
    <div className="pt-2 space-y-4">
      {/* アバター（中央揃え） */}
      <div className="flex justify-center">
        <div ref={avatarMenuRef} className="relative">
          {/* アバター本体（タップで開く） */}
          <button
            type="button"
            onClick={() => !isAvatarPending && setAvatarMenuOpen((v) => !v)}
            className="relative h-20 w-20 cursor-pointer rounded-full ring-2 ring-[#dce3ea] focus:outline-none focus-visible:ring-[#005F8C]"
            aria-label="プロフィール写真を変更"
            disabled={isLoading}
          >
            {isLoading ? (
              <Skeleton className="h-20 w-20 rounded-full" />
            ) : displayUrl ? (
              <Image src={displayUrl} alt={name} fill className="rounded-full object-cover" sizes="80px" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#005F8C]/10 text-xl font-semibold text-[#005F8C]">
                {initials || "?"}
              </span>
            )}
            {/* アップロード中オーバーレイ */}
            {isAvatarPending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </button>

          {/* カメラアイコン（右下）— 視覚補助のみ。フォーカスと aria はアバターボタン側で担う */}
          {!isLoading && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#005F8C] text-white shadow ring-2 ring-white"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          )}

          {/* 非表示ファイル入力（フォトライブラリ） */}
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isAvatarPending}
            onChange={handleFileChange}
          />
          {/* 非表示ファイル入力（カメラ） */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            disabled={isAvatarPending}
            onChange={handleFileChange}
          />

          {/* オプションメニュー */}
          {avatarMenuOpen && (
            <div className="absolute left-1/2 top-full z-20 mt-2 w-44 -translate-x-1/2 overflow-hidden rounded-[10px] border border-[#dce3ea] bg-white shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 min-h-[44px] text-sm text-[#1a2332] hover:bg-[#f2f7fa] transition-colors"
                onClick={() => { setAvatarMenuOpen(false); libraryInputRef.current?.click() }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                フォトライブラリ
              </button>
              <div className="border-t border-[#e8edf2]" />
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 min-h-[44px] text-sm text-[#1a2332] hover:bg-[#f2f7fa] transition-colors"
                onClick={() => { setAvatarMenuOpen(false); cameraInputRef.current?.click() }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                カメラ
              </button>
              {!isAvatarPending && avatarUrl && (
                <>
                  <div className="border-t border-[#e8edf2]" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 min-h-[44px] text-sm text-[#c0392b] hover:bg-[#fdecea] transition-colors"
                    onClick={() => { setAvatarMenuOpen(false); setShowDeleteConfirm(true) }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                    写真を削除
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="プロフィール写真を削除しますか？"
        description="プロフィール写真は本人確認のため必須です。削除すると再度アップロードが必要になります。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        variant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); onDelete() }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* 本人確認の注釈・アップロード形式・サイズのヒント（選択前から常時表示） */}
      {!isLoading && (
        <div className="space-y-1">
          <p className="text-center text-xs font-medium text-[#c0392b]">
            本人確認のため、必ずご本人の顔がわかる写真をアップロードしてください
          </p>
          <p className="text-center text-xs text-[#64748b]">JPEG・PNG・WebP形式・2MB以下の画像をアップロードできます</p>
        </div>
      )}

      {/* 完成度 */}
      {!isLoading && (
        <div className="rounded-[14px] bg-[#f2f7fa] px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-[#475569]">プロフィール完成度</span>
            <div className="flex items-center gap-2">
              {remainingCount > 0 && (
                <span className="text-xs text-[#64748b]">あと{remainingCount}項目</span>
              )}
              <span className="text-xs font-semibold text-[#005F8C]">{completeness}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[#dce3ea]">
            <div className="h-2 rounded-full bg-[#005F8C] transition-all duration-500" style={{ width: `${completeness}%` }} />
          </div>
          {completeness === 100 && (
            <p className="mt-1.5 text-xs text-[#005F8C]">
              プロフィールが完成しました！
            </p>
          )}
        </div>
      )}
    </div>
  )
}
