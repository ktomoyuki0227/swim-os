import { Header } from '@/components/layout/header'
import { ClassForm } from '@/components/schedule/class-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewClassPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/admin/dashboard')

  // Get coaches
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .in('role', ['admin', 'coach'])

  return (
    <>
      <Header title="クラス追加" />
      <div className="p-6 max-w-2xl">
        <ClassForm schoolId={profile.school_id} coaches={coaches ?? []} />
      </div>
    </>
  )
}
