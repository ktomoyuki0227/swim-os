"use client"

import { useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SWIM_SPECIALTIES, SWIMMING_GOALS, SWIM_LEVELS, PREFECTURES, SWIMMER_TYPES, SWIM_DISCIPLINES } from "@/types/database"
import { TagButton } from "./tag-button"
import { toggleItem, type SwimmerProfileForm } from "./types"

interface SwimmerProfileStepProps {
  form: SwimmerProfileForm
  onChange: (next: SwimmerProfileForm) => void
}

export function SwimmerProfileStep({ form, onChange }: SwimmerProfileStepProps) {
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false)
  const prefDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prefDropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (prefDropdownRef.current && !prefDropdownRef.current.contains(e.target as Node)) {
        setPrefDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [prefDropdownOpen])

  return (
    <>
      {/* アバター */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => document.getElementById("avatar-upload-input")?.click()}
          className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:border-[#005F8C]"
        >
          {form.avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatarPreview} alt="アバタープレビュー" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#64748b]">
              <span className="text-2xl">📷</span>
              <span className="text-xs leading-tight">タップして追加</span>
            </div>
          )}
        </button>
        <input
          id="avatar-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onloadend = () => onChange({ ...form, avatarFile: file, avatarPreview: reader.result as string })
            reader.readAsDataURL(file)
          }}
        />
        <div className="flex items-center gap-2 text-xs">
          <span className={form.avatarFile ? "text-[#0f8a4f]" : "text-[#c0392b] font-medium"}>
            {form.avatarFile ? "✓ 設定済み" : "プロフィール写真（必須）"}
          </span>
          {form.avatarPreview && (
            <button
              type="button"
              onClick={() => onChange({ ...form, avatarFile: null, avatarPreview: null })}
              className="text-[#c0392b] hover:text-[#c0392b]"
            >
              × 削除
            </button>
          )}
        </div>
      </div>

      {/* 水泳カテゴリ（任意） */}
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          水泳カテゴリ<span className="ml-1 text-xs text-[#64748b]">任意</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SWIM_DISCIPLINES.map((d) => (
            <TagButton
              key={d}
              label={d}
              selected={form.swimDisciplines.includes(d)}
              onClick={() => onChange({ ...form, swimDisciplines: toggleItem(form.swimDisciplines, d) })}
            />
          ))}
        </div>
      </div>

      {/* レベル */}
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          水泳レベル<span className="ml-0.5 text-[#c0392b]">*</span>
          <span className="ml-1.5 text-xs font-normal text-[#64748b]">1つ選択</span>
        </Label>
        <div className="flex gap-3">
          {SWIM_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange({ ...form, level: lvl })}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                form.level === lvl
                  ? "border-[#005F8C] bg-[#005F8C]/5 text-[#005F8C]"
                  : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* 種目・泳法 */}
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          種目・泳法<span className="ml-0.5 text-[#c0392b]">*</span>
          <span className="ml-1.5 text-xs font-normal text-[#64748b]">
            1つ以上選択（{form.specialties.length}個選択中）
          </span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SWIM_SPECIALTIES.map((s) => (
            <TagButton
              key={s}
              label={s}
              selected={form.specialties.includes(s)}
              onClick={() => onChange({ ...form, specialties: toggleItem(form.specialties, s) })}
            />
          ))}
        </div>
      </div>

      {/* 活動目的 */}
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          活動目的<span className="ml-0.5 text-[#c0392b]">*</span>
          <span className="ml-1.5 text-xs font-normal text-[#64748b]">
            1つ以上選択（{form.goals.length}個選択中）
          </span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SWIMMING_GOALS.map((g) => (
            <TagButton
              key={g}
              label={g}
              selected={form.goals.includes(g)}
              onClick={() => onChange({ ...form, goals: toggleItem(form.goals, g) })}
            />
          ))}
        </div>
      </div>

      {/* 活動エリア */}
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          活動エリア<span className="ml-0.5 text-[#c0392b]">*</span>
          <span className="ml-1.5 text-xs font-normal text-[#64748b]">
            {form.prefectures.length === 0 ? "1つ以上選択" : `${form.prefectures.length}件選択中`}
          </span>
        </Label>
        <div className="relative" ref={prefDropdownRef}>
          <button
            type="button"
            onClick={() => setPrefDropdownOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg border border-[#dce3ea] px-3 py-2.5 text-sm transition-colors hover:border-[#005F8C]/40"
          >
            <span className={form.prefectures.length === 0 ? "text-[#64748b]" : "text-[#1a2634]"}>
              {form.prefectures.length === 0
                ? "都道府県を選択してください"
                : form.prefectures.slice(0, 4).join("・") + (form.prefectures.length > 4 ? ` 他${form.prefectures.length - 4}件` : "")}
            </span>
            <span className="ml-2 shrink-0 text-[#64748b] text-xs">{prefDropdownOpen ? "▲" : "▼"}</span>
          </button>
          {prefDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#dce3ea] bg-white shadow-lg">
              <div className="max-h-52 overflow-y-auto p-2">
                <div className="grid grid-cols-3 gap-0.5">
                  {PREFECTURES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onChange({ ...form, prefectures: toggleItem(form.prefectures, p) })}
                      className={`rounded px-2 py-1.5 text-left text-xs transition-colors ${
                        form.prefectures.includes(p)
                          ? "bg-[#005F8C]/10 font-medium text-[#005F8C]"
                          : "text-[#475569] hover:bg-[#f5f8fa]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {form.prefectures.length > 0 && (
                <div className="border-t border-[#dce3ea] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...form, prefectures: [] })}
                    className="text-xs text-[#64748b] hover:text-[#c0392b]"
                  >
                    選択をクリア
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* スイマータイプ（任意） */}
      <div className="space-y-2">
        <Label className="text-sm text-[#475569]">
          スイマータイプ<span className="ml-1 text-xs text-[#64748b]">任意</span>
        </Label>
        <div className="flex gap-3">
          {SWIMMER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...form, swimmerType: form.swimmerType === t ? "" : t })}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                form.swimmerType === t
                  ? "border-[#005F8C] bg-[#005F8C]/5 text-[#005F8C]"
                  : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 自己紹介（任意） */}
      <div className="space-y-1.5">
        <Label className="text-sm text-[#475569]">
          自己紹介<span className="ml-1 text-xs text-[#64748b]">任意</span>
        </Label>
        <Textarea
          placeholder="例: マスターズ水泳歴10年。クロールと個人メドレーが得意です。"
          value={form.bio}
          onChange={(e) => onChange({ ...form, bio: e.target.value })}
          className="border-[#dce3ea]"
          rows={3}
          maxLength={500}
        />
      </div>
    </>
  )
}
