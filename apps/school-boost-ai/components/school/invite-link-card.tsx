'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Copy, Check } from 'lucide-react'

interface InviteLinkCardProps {
  inviteCode: string
  appUrl: string
}

export function InviteLinkCard({ inviteCode, appUrl }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${appUrl}/register?code=${inviteCode}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-500" />
          保護者招待リンク
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500">
          このリンクを保護者に共有すると、スクールに自動で紐づいた状態でアカウント登録できます。
        </p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-600 flex-1 truncate font-mono">
            {inviteUrl}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 flex-shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          招待コード: <span className="font-mono font-semibold text-gray-600">{inviteCode}</span>
        </p>
      </CardContent>
    </Card>
  )
}
