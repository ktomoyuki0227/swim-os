'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function createAnnouncement(data: {
  title: string
  body: string
  targetType: string
  isPublished: boolean
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('announcements').insert({
    school_id: SCHOOL_ID,
    title: data.title,
    body: data.body,
    target_type: data.targetType,
    is_published: data.isPublished,
    published_at: data.isPublished ? new Date().toISOString() : null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/announcements')
}
