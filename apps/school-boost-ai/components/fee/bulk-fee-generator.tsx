'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { bulkCreateFees } from '@/actions/fees'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BulkFeeGeneratorProps {
  schoolId: string
  targetMonth: string
}

export function BulkFeeGenerator({ schoolId, targetMonth }: BulkFeeGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    const result = await bulkCreateFees(schoolId, targetMonth)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('月謝を一括生成しました')
      router.refresh()
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      size="sm"
      variant="outline"
      className="gap-1.5"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? '生成中...' : '月謝を一括生成'}
    </Button>
  )
}
