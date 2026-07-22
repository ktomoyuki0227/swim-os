export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getPublicTeam } from "@/actions/teams"
import { getMyJoinRequest } from "@/actions/join-requests"
import { PublicTeamView } from "@/components/teams/public-team-view"
import { AdminPreviewBanner } from "./admin-preview-banner"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPreviewPage({ params }: PageProps) {
  const { id } = await params

  const result = await getPublicTeam(id)
  if (result.error || !result.data) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 未ログイン: 公開ビューをそのまま表示
    return (
      <div className="min-h-screen">
        <PublicTeamView data={result.data} hasBottomNav={false} isLoggedIn={false} />
      </div>
    )
  }

  // ログイン済み: メンバーシップ確認
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  const isAdmin = membership?.role === "admin"
  const isMember = !!membership

  // 一般メンバーはチームページへリダイレクト
  if (isMember && !isAdmin) {
    redirect(`/teams/${id}`)
  }

  // 管理者: 管理者バナー + ゲスト目線のプレビュー（CTA非表示）
  if (isAdmin) {
    return (
      <div className="min-h-screen">
        <AdminPreviewBanner teamId={id} />
        <PublicTeamView data={result.data} hasBottomNav={false} isLoggedIn={true} isAdmin={true} />
      </div>
    )
  }

  // 非メンバー（ログイン済み）: 参加申請状況を確認して表示
  const joinRequestResult = await getMyJoinRequest(id)
  const joinRequestStatus = (joinRequestResult.data?.status ?? null) as "pending" | "approved" | "rejected" | null

  return (
    <div className="min-h-screen">
      <PublicTeamView
        data={result.data}
        hasBottomNav={false}
        isLoggedIn={true}
        joinRequestStatus={joinRequestStatus}
      />
    </div>
  )
}
