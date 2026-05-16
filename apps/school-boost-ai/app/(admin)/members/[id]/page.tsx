import { redirect } from 'next/navigation'
export default function OldMemberDetail({ params }: { params: Promise<{ id: string }> }) {
  redirect('/admin/members')
}
