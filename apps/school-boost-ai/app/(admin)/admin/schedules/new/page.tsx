import { Header } from '@/components/layout/header'
import { ClassForm } from '@/components/schedule/class-form'
import { createAdminClient } from '@/lib/supabase/admin'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function NewClassPage() {
  const supabase = createAdminClient()

  // Get coaches
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('school_id', SCHOOL_ID)
    .in('role', ['admin', 'coach'])

  return (
    <>
      <Header title="クラス追加" />
      <div className="p-6 max-w-2xl">
        <ClassForm schoolId={SCHOOL_ID} coaches={coaches ?? []} />
      </div>
    </>
  )
}
