'use client'

import { updateFeeStatus } from '@/actions/fees'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

interface FeeStatusToggleProps {
  feeId: string
  currentStatus: string
}

export function FeeStatusToggle({ feeId, currentStatus }: FeeStatusToggleProps) {
  async function handleStatus(status: 'unpaid' | 'paid' | 'overdue') {
    const result = await updateFeeStatus(feeId, status)
    if (result?.error) {
      toast.error(result.error)
    } else {
      const label = status === 'paid' ? '支払済' : status === 'overdue' ? '延滞' : '未払い'
      toast.success(`ステータスを「${label}」に変更しました`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent text-muted-foreground">
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== 'paid' && (
          <DropdownMenuItem onClick={() => handleStatus('paid')}>
            支払済みにする
          </DropdownMenuItem>
        )}
        {currentStatus !== 'unpaid' && (
          <DropdownMenuItem onClick={() => handleStatus('unpaid')}>
            未払いに戻す
          </DropdownMenuItem>
        )}
        {currentStatus !== 'overdue' && (
          <DropdownMenuItem
            onClick={() => handleStatus('overdue')}
            className="text-orange-600"
          >
            延滞にする
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
