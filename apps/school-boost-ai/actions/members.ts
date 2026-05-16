'use server'

import { createClient } from '@/lib/supabase/server'
import { memberSchema, type MemberFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function getMembers(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select('*, profiles!parent_id(id, name, email, phone)')
    .eq('school_id', schoolId)
    .order('name_kana')

  if (error) throw new Error(error.message)
  return data
}

export async function getMember(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      profiles!parent_id(id, name, email, phone),
      enrollments(
        id, status, enrolled_at,
        classes(id, name, color)
      ),
      grade_histories(
        id, from_level, to_level, comment, evaluated_at,
        profiles!evaluated_by(name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createMember(schoolId: string, formData: MemberFormData) {
  const supabase = await createClient()

  const result = memberSchema.safeParse(formData)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('members')
    .insert({ ...result.data, school_id: schoolId })

  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  return { success: true }
}

export async function updateMember(id: string, formData: Partial<MemberFormData>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .update(formData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  revalidatePath(`/admin/members/${id}`)
  return { success: true }
}

export async function updateMemberStatus(
  id: string,
  status: 'active' | 'suspended' | 'withdrawn'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  return { success: true }
}
