"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { regenerateInviteCode } from "@/actions/teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Team } from "@/types/database"

interface InviteSectionProps {
  team: Team
}

export function InviteSection({ team }: InviteSectionProps) {
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
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#dce3ea]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2332]">招待QRコード</CardTitle>
          <p className="text-xs text-[#5c6a7a]">このQRコードをLINEグループ等でシェアしてください</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-[#dce3ea] bg-white p-4">
            <QRCodeSVG
              value={inviteUrl}
              size={180}
              fgColor="#1a2332"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-center text-xs text-[#5c6a7a]">{team.name} への招待リンク</p>
        </CardContent>
      </Card>

      <Card className="border-[#dce3ea]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2332]">招待リンク</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#dce3ea] bg-[#f2f7fa] px-3 py-2.5">
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
            <p className="rounded-lg border border-[#c0392b]/20 bg-[#fdecea] px-3 py-2 text-xs text-[#c0392b]">
              {regenerateError}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
