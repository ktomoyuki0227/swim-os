'use server'

import { createClient } from '@/lib/supabase/server'
import { feeSchema, type FeeFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function getMonthlyFees(schoolId: string, targetMonth?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('monthly_fees')
    .select(`
      *,
      members(id, name, name_kana, status)
    `)
    .eq('school_id', schoolId)
    .order('target_month', { ascending: false })

  if (targetMonth) {
    query = query.eq('target_month', targetMonth)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getMemberFees(memberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_fees')
    .select('*')
    .eq('member_id', memberId)
    .order('target_month', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createFee(schoolId: string, formData: FeeFormData) {
  const supabase = await createClient()

  const result = feeSchema.safeParse(formData)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('monthly_fees')
    .insert({ ...result.data, school_id: schoolId })

  if (error) return { error: error.message }

  revalidatePath('/admin/fees')
  return { success: true }
}

export async function updateFeeStatus(
  feeId: string,
  status: 'unpaid' | 'paid' | 'overdue',
  paidAt?: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monthly_fees')
    .update({
      status,
      paid_at: status === 'paid' ? (paidAt || new Date().toISOString()) : null,
    })
    .eq('id', feeId)

  if (error) return { error: error.message }

  revalidatePath('/admin/fees')
  return { success: true }
}

export async function bulkCreateFees(
  schoolId: string,
  targetMonth: string,
  entries: Array<{ member_id: string; amount: number }>
) {
  const supabase = await createClient()

  const records = entries.map((e) => ({
    school_id: schoolId,
    member_id: e.member_id,
    amount: e.amount,
    target_month: targetMonth,
    status: 'unpaid' as const,
  }))

  const { error } = await supabase
    .from('monthly_fees')
    .upsert(records, { onConflict: 'member_id,target_month' })

  if (error) return { error: error.message }

  revalidatePath('/admin/fees')
  return { success: true }
}

export async function getFeesSummary(schoolId: string, targetMonth: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_fees')
    .select('status, amount')
    .eq('school_id', schoolId)
    .eq('target_month', targetMonth)

  if (error) throw new Error(error.message)

  const total = data.reduce((sum, f) => sum + f.amount, 0)
  const paid = data.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)
  const unpaid = data.filter((f) => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0)
  const paidCount = data.filter((f) => f.status === 'paid').length
  const unpaidCount = data.filter((f) => f.status !== 'paid').length

  return { total, paid, unpaid, paidCount, unpaidCount, count: data.length }
}
