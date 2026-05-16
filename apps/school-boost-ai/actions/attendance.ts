'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAttendanceByDate(scheduleId: string, lessonDate: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      members(id, name, name_kana, current_level, qr_code)
    `)
    .eq('schedule_id', scheduleId)
    .eq('lesson_date', lessonDate)

  if (error) throw new Error(error.message)
  return data
}

export async function getMemberAttendance(memberId: string, limit = 30) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      schedules(
        id, day_of_week, start_time, end_time,
        classes(id, name, color)
      )
    `)
    .eq('member_id', memberId)
    .order('lesson_date', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}

export async function recordAttendance(
  memberId: string,
  scheduleId: string,
  lessonDate: string,
  status: 'present' | 'absent' | 'makeup',
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('attendance_records')
    .upsert({
      member_id: memberId,
      schedule_id: scheduleId,
      lesson_date: lessonDate,
      status,
      notes: notes || null,
      recorded_by: user?.id || null,
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/attendance')
  return { success: true }
}

export async function bulkRecordAttendance(
  records: Array<{
    member_id: string
    schedule_id: string
    lesson_date: string
    status: 'present' | 'absent' | 'makeup'
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('attendance_records')
    .upsert(records.map((r) => ({ ...r, recorded_by: user?.id || null })))

  if (error) return { error: error.message }

  revalidatePath('/admin/attendance')
  return { success: true }
}

export async function getSchedulesForDate(schoolId: string, date: string) {
  const d = new Date(date)
  const dayOfWeek = d.getDay()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      classes!inner(
        id, name, color, school_id,
        enrollments(
          id, status,
          members(id, name, name_kana, current_level)
        )
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .eq('classes.school_id', schoolId)

  if (error) throw new Error(error.message)
  return data
}
