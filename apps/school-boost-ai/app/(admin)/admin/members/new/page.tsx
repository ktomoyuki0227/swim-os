import { Header } from '@/components/layout/header'
import { MemberForm } from '@/components/member/member-form'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string }>
}) {
  const { class_id } = await searchParams

  return (
    <>
      <Header title="会員追加" />
      <div className="p-6 max-w-2xl">
        <MemberForm schoolId={SCHOOL_ID} classId={class_id} />
      </div>
    </>
  )
}
