'use client'

import { updateMemberStatus } from '@/actions/members'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface MemberStatusActionsProps {
  memberId: string
  currentStatus: string
}

export function MemberStatusActions({ memberId, currentStatus }: MemberStatusActionsProps) {
  async function handleStatus(status: 'active' | 'suspended' | 'withdrawn') {
    const result = await updateMemberStatus(memberId, status)
    if (result?.error) {
      toast.error(result.error)
    } else {
      const label = status === 'active' ? '在籍' : status === 'suspended' ? '休会' : '退会'
      toast.success(`ステータスを「${label}」に変更しました`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
        ステータス変更
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== 'active' && (
          <DropdownMenuItem onClick={() => handleStatus('active')}>
            在籍に変更
          </DropdownMenuItem>
        )}
        {currentStatus !== 'suspended' && (
          <DropdownMenuItem onClick={() => handleStatus('suspended')}>
            休会に変更
          </DropdownMenuItem>
        )}
        {currentStatus !== 'withdrawn' && (
          <DropdownMenuItem
            onClick={() => handleStatus('withdrawn')}
            className="text-red-600"
          >
            退会処理
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
