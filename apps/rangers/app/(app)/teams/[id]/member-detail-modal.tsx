"use client"

import { useState, useEffect, useRef } from "react"
import { getMemberEmail, updateMemberInfo, updateMemberProfileTags } from "@/actions/teams"
import { useToast } from "@/components/toast"
import { SYSTEM_TAGS } from "@/types/database"
import type { TeamMemberWithProfile, MembershipType } from "@/types/database"

// プロフィールデータを SYSTEM_TAGS の ID 配列に変換
function profileToTagIds(swimmer: TeamMemberWithProfile["swimmer"]): string[] {
  if (!swimmer) return []
  const tags: string[] = []
  if (swimmer.level === "初級") tags.push("level_beginner")
  else if (swimmer.level === "中級") tags.push("level_intermediate")
  else if (swimmer.level === "上級") tags.push("level_advanced")
  const specs = swimmer.specialties ?? []
  if (specs.includes("クロール")) tags.push("stroke_freestyle")
  if (specs.includes("背泳ぎ")) tags.push("stroke_backstroke")
  if (specs.includes("平泳ぎ")) tags.push("stroke_breaststroke")
  if (specs.includes("バタフライ")) tags.push("stroke_butterfly")
  if (specs.includes("個人メドレー")) tags.push("stroke_medley")
  const goals = swimmer.swimming_goals ?? []
  if (goals.includes("健康維持")) tags.push("purpose_health")
  if (goals.includes("競技・タイム向上")) tags.push("purpose_competitive")
  if (swimmer.swimmer_type === "選手") tags.push("swimmer_type_player")
  else if (swimmer.swimmer_type === "マスターズ") tags.push("swimmer_type_masters")
  const disciplines = swimmer.swim_disciplines ?? []
  if (disciplines.includes("競泳")) tags.push("discipline_swimming")
  if (disciplines.includes("シンクロ")) tags.push("discipline_synchro")
  if (disciplines.includes("オープンウォーター")) tags.push("discipline_openwater")
  if (disciplines.includes("飛び込み")) tags.push("discipline_diving")
  if (disciplines.includes("水球")) tags.push("discipline_waterpolo")
  return tags
}

function tagIdsToProfile(tags: string[]) {
  const LEVEL_MAP: Record<string, string> = {
    level_beginner: "初級",
    level_intermediate: "中級",
    level_advanced: "上級",
  }
  const SPECIALTY_MAP: Record<string, string> = {
    stroke_freestyle: "クロール",
    stroke_backstroke: "背泳ぎ",
    stroke_breaststroke: "平泳ぎ",
    stroke_butterfly: "バタフライ",
    stroke_medley: "個人メドレー",
  }
  const GOAL_MAP: Record<string, string> = {
    purpose_health: "健康維持",
    purpose_competitive: "競技・タイム向上",
  }
  const SWIMMER_TYPE_MAP: Record<string, string> = {
    swimmer_type_player: "選手",
    swimmer_type_masters: "マスターズ",
  }
  const DISCIPLINE_MAP: Record<string, string> = {
    discipline_swimming: "競泳",
    discipline_synchro: "シンクロ",
    discipline_openwater: "オープンウォーター",
    discipline_diving: "飛び込み",
    discipline_waterpolo: "水球",
  }
  const levelTag = tags.find((t) => t.startsWith("level_"))
  const level = levelTag ? (LEVEL_MAP[levelTag] ?? null) : null
  const specialties = tags.filter((t) => t.startsWith("stroke_")).map((t) => SPECIALTY_MAP[t]).filter((v): v is string => !!v)
  const swimmingGoals = tags.filter((t) => t.startsWith("purpose_")).map((t) => GOAL_MAP[t]).filter((v): v is string => !!v)
  const swimmerTypeTag = tags.find((t) => t.startsWith("swimmer_type_"))
  const swimmerType = swimmerTypeTag ? (SWIMMER_TYPE_MAP[swimmerTypeTag] ?? null) : null
  const swimDisciplines = tags.filter((t) => t.startsWith("discipline_")).map((t) => DISCIPLINE_MAP[t]).filter((v): v is string => !!v)
  return { level, specialties, swimmingGoals, swimmerType, swimDisciplines }
}

const LEVEL_TAG_IDS = ["level_beginner", "level_intermediate", "level_advanced"]
const SWIMMER_TYPE_TAG_IDS = ["swimmer_type_player", "swimmer_type_masters"]

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-[#8d99a8]">{label}</span>
      <span className="text-right text-[#1a2332]">{value}</span>
    </div>
  )
}

interface MemberDetailModalProps {
  member: TeamMemberWithProfile
  teamId: string
  currentUserId: string
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
  initialTab?: "detail" | "edit"
  onClose: () => void
  onSuccess: () => void
}

export function MemberDetailModal({
  member,
  teamId,
  currentUserId,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  pointCardCount,
  initialTab = "detail",
  onClose,
  onSuccess,
}: MemberDetailModalProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<"detail" | "edit">(initialTab)

  // 詳細タブ: メールアドレス取得
  const [email, setEmail] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const emailFetchedRef = useRef(false)

  // 編集タブ
  const membershipOptions = [
    hasAnnualFee ? { value: "annual" as MembershipType, label: "年会費" } : null,
    hasMonthlyFee ? { value: "monthly" as MembershipType, label: "月謝" } : null,
    hasPointCard ? { value: "point_card" as MembershipType, label: "回数券" } : null,
  ].filter(Boolean) as { value: MembershipType; label: string }[]

  const currentType = member.membership_type as MembershipType
  const initialType: MembershipType =
    membershipOptions.some((o) => o.value === currentType)
      ? currentType
      : (membershipOptions[0]?.value ?? "monthly")

  const defaultStampForPointCard =
    member.membership_type === "point_card"
      ? (member.stamp_remaining ?? pointCardCount)
      : pointCardCount

  const [membershipType, setMembershipType] = useState<MembershipType>(initialType)
  const [stampRemaining, setStampRemaining] = useState(defaultStampForPointCard)
  const [selectedTags, setSelectedTags] = useState<string[]>(() => profileToTagIds(member.swimmer))
  const [role, setRole] = useState<"admin" | "member">((member.role as "admin" | "member") ?? "member")
  const [isSaving, setIsSaving] = useState(false)

  const swimmer = member.swimmer

  const tagsByCategory = SYSTEM_TAGS.reduce<Record<string, (typeof SYSTEM_TAGS)[number][]>>(
    (acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = []
      acc[tag.category].push(tag)
      return acc
    },
    {}
  )

  const isSelf = swimmer?.id === currentUserId

  // 詳細タブを開いたときにメールを取得（1回のみ）
  useEffect(() => {
    if (activeTab === "detail" && swimmer?.id && !emailFetchedRef.current) {
      emailFetchedRef.current = true
      setEmailLoading(true)
      getMemberEmail(teamId, swimmer.id).then((res) => {
        setEmail(res.email ?? null)
        setEmailLoading(false)
      })
    }
  }, [activeTab, swimmer?.id, teamId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleMembershipTypeChange = (type: MembershipType) => {
    setMembershipType(type)
    if (type === "point_card") setStampRemaining(defaultStampForPointCard)
  }

  const handleStampInput = (value: string) => {
    const n = parseInt(value, 10)
    setStampRemaining(isNaN(n) ? 0 : Math.max(0, n))
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      if (LEVEL_TAG_IDS.includes(tagId)) {
        const isSelected = prev.includes(tagId)
        return isSelected
          ? prev.filter((t) => !LEVEL_TAG_IDS.includes(t))
          : [...prev.filter((t) => !LEVEL_TAG_IDS.includes(t)), tagId]
      }
      if (SWIMMER_TYPE_TAG_IDS.includes(tagId)) {
        const isSelected = prev.includes(tagId)
        return isSelected
          ? prev.filter((t) => !SWIMMER_TYPE_TAG_IDS.includes(t))
          : [...prev.filter((t) => !SWIMMER_TYPE_TAG_IDS.includes(t)), tagId]
      }
      return prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    })
  }

  const handleSubmit = async () => {
    if (!swimmer?.id) return
    setIsSaving(true)
    try {
      const { level, specialties, swimmingGoals, swimmerType, swimDisciplines } = tagIdsToProfile(selectedTags)
      const [result, tagResult] = await Promise.all([
        updateMemberInfo(teamId, swimmer.id, {
          membershipType,
          stampRemaining: membershipType === "point_card" ? stampRemaining : undefined,
          role,
        }),
        updateMemberProfileTags(teamId, swimmer.id, { level, specialties, swimmingGoals, swimmerType, swimDisciplines }),
      ])
      const errors = [result.error, tagResult.error].filter(Boolean)
      if (errors.length > 0) {
        showToast(errors.join(" / "), "error")
      } else {
        showToast("メンバー情報を更新しました", "success")
        onSuccess()
      }
    } catch {
      showToast("通信エラーが発生しました", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const genderLabel =
    swimmer?.gender === "male" ? "男性" : swimmer?.gender === "female" ? "女性" : swimmer?.gender === "other" ? "その他" : null

  const membershipLabel =
    member.membership_type === "annual"
      ? "年会費"
      : member.membership_type === "monthly"
        ? "月謝"
        : member.membership_type === "point_card"
          ? `回数券（残${member.stamp_remaining ?? 0}）`
          : "メンバー"

  const joinedAt = new Date(member.joined_at).toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex max-h-[85dvh] w-full max-w-sm flex-col rounded-t-2xl border border-[#dce3ea] bg-white shadow-xl sm:rounded-2xl">
        {/* ヘッダー */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#dce3ea] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
              {swimmer?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={swimmer.avatar_url} alt={swimmer.name || ""} className="h-full w-full object-cover" />
              ) : (
                swimmer?.name?.[0] || "?"
              )}
            </div>
            <div>
              <p className="font-semibold text-[#1a2332]">{swimmer?.name || "不明"}</p>
              {swimmer?.furigana && (
                <p className="text-xs text-[#8d99a8]">{swimmer.furigana}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#8d99a8] hover:bg-[#f2f7fa] hover:text-[#5c6a7a]"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* タブ */}
        <div className="flex shrink-0 border-b border-[#dce3ea]">
          {(["detail", "edit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-[#005F8C] text-[#005F8C]"
                  : "text-[#8d99a8] hover:text-[#5c6a7a]"
              }`}
            >
              {tab === "detail" ? "詳細" : "編集"}
            </button>
          ))}
        </div>

        {/* 詳細タブ */}
        {activeTab === "detail" && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="divide-y divide-[#e8edf2]">
              {/* メンバー情報 */}
              <div className="pb-3">
                <p className="mb-2 text-xs font-medium text-[#8d99a8]">メンバー情報</p>
                <InfoRow label="役割" value={member.role === "admin" ? "管理者" : "一般メンバー"} />
                <InfoRow label="会員種別" value={membershipLabel} />
                <InfoRow label="参加日" value={joinedAt} />
              </div>

              {/* 基本情報 */}
              <div className="py-3">
                <p className="mb-2 text-xs font-medium text-[#8d99a8]">基本情報</p>
                <InfoRow label="メールアドレス" value={emailLoading ? "取得中..." : email ?? "—"} />
                <InfoRow label="電話番号" value={swimmer?.phone} />
                <InfoRow label="性別" value={genderLabel} />
                <InfoRow label="生年月日" value={swimmer?.birthday} />
                <InfoRow label="住所" value={swimmer?.address} />
              </div>

              {/* 緊急連絡先 */}
              {(swimmer?.emergency_contact || swimmer?.emergency_contact_name) && (
                <div className="py-3">
                  <p className="mb-2 text-xs font-medium text-[#8d99a8]">緊急連絡先</p>
                  <InfoRow label="氏名" value={swimmer?.emergency_contact_name} />
                  <InfoRow label="続柄" value={swimmer?.emergency_contact_relation} />
                  <InfoRow label="電話番号" value={swimmer?.emergency_contact} />
                </div>
              )}

              {/* 水泳情報 */}
              <div className="py-3">
                <p className="mb-2 text-xs font-medium text-[#8d99a8]">水泳情報</p>
                <InfoRow label="レベル" value={swimmer?.level} />
                <InfoRow label="スイマータイプ" value={swimmer?.swimmer_type} />
                {(swimmer?.swim_disciplines ?? []).length > 0 && (
                  <div className="flex justify-between gap-4 py-2 text-sm">
                    <span className="shrink-0 text-[#8d99a8]">水泳カテゴリ</span>
                    <span className="text-right text-[#1a2332]">{(swimmer?.swim_disciplines ?? []).join("・")}</span>
                  </div>
                )}
                {(swimmer?.specialties ?? []).length > 0 && (
                  <div className="flex justify-between gap-4 py-2 text-sm">
                    <span className="shrink-0 text-[#8d99a8]">得意種目</span>
                    <span className="text-right text-[#1a2332]">{(swimmer?.specialties ?? []).join("・")}</span>
                  </div>
                )}
                {(swimmer?.swimming_goals ?? []).length > 0 && (
                  <div className="flex justify-between gap-4 py-2 text-sm">
                    <span className="shrink-0 text-[#8d99a8]">活動目的</span>
                    <span className="text-right text-[#1a2332]">{(swimmer?.swimming_goals ?? []).join("・")}</span>
                  </div>
                )}
              </div>

              {/* 登録情報 */}
              {(swimmer?.masters_registered || swimmer?.jsa_registered) && (
                <div className="py-3">
                  <p className="mb-2 text-xs font-medium text-[#8d99a8]">登録情報</p>
                  {swimmer?.masters_registered && (
                    <InfoRow label="マスターズ登録" value={swimmer.masters_number ? `登録済（${swimmer.masters_number}）` : "登録済"} />
                  )}
                  {swimmer?.jsa_registered && (
                    <InfoRow label="JSA登録" value={swimmer.jsa_number ? `登録済（${swimmer.jsa_number}）` : "登録済"} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 編集タブ */}
        {activeTab === "edit" && (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* 会員種別 */}
              {membershipOptions.length > 0 && (
                <div>
                  <p className="mb-2.5 text-sm font-medium text-[#1a2332]">会員種別</p>
                  <div className="flex flex-wrap gap-2">
                    {membershipOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleMembershipTypeChange(opt.value)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          membershipType === opt.value
                            ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                            : "border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 回数券残数 */}
              {membershipType === "point_card" && (
                <div>
                  <p className="mb-2.5 text-sm font-medium text-[#1a2332]">回数券残数</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStampRemaining((n) => Math.max(0, n - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] text-lg text-[#5c6a7a] transition-colors hover:border-[#005F8C] hover:text-[#005F8C]"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={stampRemaining}
                      onChange={(e) => handleStampInput(e.target.value)}
                      className="w-16 rounded-xl border border-[#dce3ea] px-2 py-1.5 text-center text-sm text-[#1a2332] focus:border-[#005F8C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setStampRemaining((n) => n + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] text-lg text-[#5c6a7a] transition-colors hover:border-[#005F8C] hover:text-[#005F8C]"
                    >
                      ＋
                    </button>
                    <span className="text-sm text-[#5c6a7a]">回</span>
                  </div>
                </div>
              )}

              {/* タグ */}
              <div>
                <p className="mb-2.5 text-sm font-medium text-[#1a2332]">タグ</p>
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div key={category} className="mb-3">
                    <p className="mb-1.5 text-xs text-[#8d99a8]">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            selectedTags.includes(tag.id)
                              ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                              : "border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]"
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 役割 */}
              <div>
                <p className="mb-2.5 text-sm font-medium text-[#1a2332]">グループでの役割</p>
                {isSelf ? (
                  <p className="text-xs text-[#8d99a8]">自分の役割は変更できません</p>
                ) : (
                  <div className="flex gap-2">
                    {(["member", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          role === r
                            ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                            : "border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]"
                        }`}
                      >
                        {r === "admin" ? "管理者" : "一般メンバー"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* フッター */}
            <div className="flex shrink-0 gap-2 border-t border-[#dce3ea] px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-full border border-[#dce3ea] py-2.5 text-sm font-medium text-[#5c6a7a] transition-colors hover:border-[#005F8C] disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 rounded-full bg-[#005F8C] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004E73] disabled:opacity-50"
                style={{ minHeight: "44px" }}
              >
                {isSaving ? "保存中..." : "保存する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
