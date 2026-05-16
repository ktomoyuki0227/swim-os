'use server'

import { createClient } from '@/lib/supabase/server'
import { classSchema, scheduleSchema, type ClassFormData, type ScheduleFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function getClasses(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      profiles!coach_id(id, name),
      schedules(id, day_of_week, start_time, end_time, is_active)
    `)
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

export async function getClass(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      profiles!coach_id(id, name),
      schedules(id, day_of_week, start_time, end_time, is_active),
      enrollments(
        id, status,
        members(id, name, name_kana, current_level, status)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createClass(schoolId: string, formData: ClassFormData) {
  const supabase = await createClient()

  const result = classSchema.safeParse(formData)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { coach_id, ...rest } = result.data
  const { error } = await supabase
    .from('classes')
    .insert({
      ...rest,
      school_id: schoolId,
      coach_id: coach_id || null,
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/schedules')
  return { success: true }
}

export async function addSchedule(formData: ScheduleFormData) {
  const supabase = await createClient()

  const result = scheduleSchema.safeParse(formData)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('schedules')
    .insert(result.data)

  if (error) return { error: error.message }

  revalidatePath('/admin/schedules')
  return { success: true }
}

export async function enrollMember(memberId: string, classId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('enrollments')
    .upsert({ member_id: memberId, class_id: classId, status: 'active' })

  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  return { success: true }
}
