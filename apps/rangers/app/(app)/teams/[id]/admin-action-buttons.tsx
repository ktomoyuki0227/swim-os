"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { regenerateInviteCode } from "@/actions/teams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Team } from "@/types/database"

interface AdminActionButtonsProps {
  team: Team
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function AdminActionButtons({ team }: AdminActionButtonsProps) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 招待モーダル用のローカル state
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/teams/join/${team.invite_code}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    if (!confirm("招待コードを再生成しますか？\n現在のリンクは使えなくなります。")) return
    setIsRegenerating(true)
    setRegenerateError(null)
    const result = await regenerateInviteCode(team.id)
    setIsRegenerating(false)
    if ("error" in result && result.error) {
      setRegenerateError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 招待ボタン */}
        <button
          onClick={() => setInviteOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] bg-white text-[#005F8C] shadow-sm transition-colors hover:border-[#005F8C] hover:bg-[#e8f2f8]"
          aria-label="招待"
          title="招待"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        {/* 設定ボタン */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3ea] bg-white text-[#005F8C] shadow-sm transition-colors hover:border-[#005F8C] hover:bg-[#e8f2f8]"
          aria-label="設定"
          title="設定"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* 招待モーダル */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setInviteOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-white sm:rounded-2xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-[#dce3ea] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#1a2332]">招待</h2>
              <button
                onClick={() => setInviteOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#5c6a7a] hover:bg-[#f0f3f7]"
                aria-label="閉じる"
              >
                <CloseIcon />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="flex flex-col items-center gap-3 px-5 py-4">
              {/* QRコード */}
              <div className="rounded-xl border border-[#dce3ea] bg-white p-3">
                <QRCodeSVG value={inviteUrl} size={128} fgColor="#1a2332" bgColor="#ffffff" />
              </div>
              <p className="text-xs text-[#5c6a7a]">{team.name} への招待リンク</p>

              {/* 招待リンク */}
              <div className="w-full space-y-2">
                <div className="flex items-center rounded-lg border border-[#dce3ea] bg-[#f2f7fa] px-3 py-2">
                  <p className="flex-1 truncate text-xs text-[#5c6a7a]">{inviteUrl}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 rounded-full border-[#005F8C] text-[#005F8C]"
                    style={{ minHeight: "44px" }}
                  >
                    {copied ? "コピーしました！" : "リンクをコピー"}
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    variant="outline"
                    className="rounded-full border-[#dce3ea] text-[#5c6a7a]"
                    style={{ minHeight: "44px" }}
                  >
                    {isRegenerating ? "更新中..." : "再生成"}
                  </Button>
                </div>
                {regenerateError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {regenerateError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSettingsOpen(false)} />
          <div className="relative z-10 w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl" style={{ maxHeight: "85vh" }}>
            <div className="flex items-center justify-between border-b border-[#dce3ea] px-5 py-4">
              <h2 className="text-base font-semibold text-[#1a2332]">グループ設定</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#5c6a7a] hover:bg-[#f0f3f7]"
                aria-label="閉じる"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Card className="border-[#dce3ea]">
                <CardHeader>
                  <CardTitle className="text-base text-[#1a2332]">料金体系</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {team.has_session_fee && (
                      <span className="rounded-full bg-[#e8f2f8] px-2.5 py-0.5 text-xs text-[#005F8C]">参加費</span>
                    )}
                    {team.has_annual_fee && (
                      <span className="rounded-full bg-[#e8f2f8] px-2.5 py-0.5 text-xs text-[#005F8C]">年会費</span>
                    )}
                    {team.has_monthly_fee && (
                      <span className="rounded-full bg-[#e8f2f8] px-2.5 py-0.5 text-xs text-[#005F8C]">月謝</span>
                    )}
                    {team.has_point_card && (
                      <span className="rounded-full bg-[#e8f2f8] px-2.5 py-0.5 text-xs text-[#005F8C]">回数券</span>
                    )}
                    {!team.has_session_fee && !team.has_annual_fee && !team.has_monthly_fee && !team.has_point_card && (
                      <span className="text-xs text-[#8d99a8]">料金体系なし</span>
                    )}
                  </div>
                  {team.has_session_fee && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5c6a7a]">デフォルト参加費（メンバー）</span>
                        <span className="font-medium text-[#1a2332]">
                          ¥{(team.default_member_price || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5c6a7a]">デフォルト参加費（ゲスト）</span>
                        <span className="font-medium text-[#1a2332]">
                          ¥{(team.default_guest_price || 0).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {team.has_annual_fee && team.annual_fee_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#5c6a7a]">年会費</span>
                      <span className="font-medium text-[#1a2332]">
                        ¥{team.annual_fee_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {team.has_monthly_fee && team.monthly_fee_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#5c6a7a]">月謝</span>
                      <span className="font-medium text-[#1a2332]">
                        ¥{team.monthly_fee_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {team.has_session_fee && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#5c6a7a]">キャンセル期限</span>
                      <span className="font-medium text-[#1a2332]">
                        {team.cancellation_days}日前まで
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(team.practice_frequency || (team.practice_days ?? []).length > 0 || team.main_pool) && (
                <Card className="border-[#dce3ea]">
                  <CardHeader>
                    <CardTitle className="text-base text-[#1a2332]">練習情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {team.main_pool && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5c6a7a]">主な使用プール</span>
                        <span className="font-medium text-[#1a2332]">{team.main_pool}</span>
                      </div>
                    )}
                    {team.practice_frequency && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5c6a7a]">練習頻度</span>
                        <span className="font-medium text-[#1a2332]">{team.practice_frequency}</span>
                      </div>
                    )}
                    {(team.practice_days ?? []).length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#5c6a7a]">練習曜日</span>
                        <div className="flex gap-1">
                          {(team.practice_days ?? []).map((day: string) => (
                            <span
                              key={day}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f2f8] text-[10px] font-medium text-[#005F8C]"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Link href={`/teams/${team.id}/edit`}>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#005F8C] text-[#005F8C]"
                  style={{ minHeight: "48px" }}
                >
                  グループ情報を編集
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
