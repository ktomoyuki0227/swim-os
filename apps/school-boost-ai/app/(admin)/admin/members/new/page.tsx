import { Header } from '@/components/layout/header'
import { MemberForm } from '@/components/member/member-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/admin/dashboard')

  const { class_id } = await searchParams

  return (
    <>
      <Header title="会員追加" />
      <div className="p-6 max-w-2xl">
        <MemberForm schoolId={profile.school_id} classId={class_id} />
      </div>
    </>
  )
}
