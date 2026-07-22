import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { JoinForm } from "./join-form"

interface PageProps {
  params: Promise<{ inviteCode: string }>
}

export default async function TeamJoinPage({ params }: PageProps) {
  const { inviteCode } = await params

  const admin = createAdminClient()
  const { data: team } = await admin
    .from("teams")
    .select("id, name, description, point_card_count, has_annual_fee, has_monthly_fee, has_point_card")
    .eq("invite_code", inviteCode)
    .eq("status", "active")
    .single()

  if (!team) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-5xl">🔗</div>
        <h1 className="mb-2 text-xl font-bold text-[#1a2332]">招待リンクが無効です</h1>
        <p className="mb-8 text-sm text-[#475569]">
          このリンクは期限切れか、存在しないグループの招待コードです。
          <br />コーチに最新のリンクを送ってもらってください。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-[#005F8C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#004E73]"
        >
          トップページへ
        </Link>
      </div>
    )
  }

  // ログイン状態確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // 既にメンバーかチェック
    const { data: existing } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("swimmer_id", user.id)
      .single()

    if (existing) {
      redirect(`/teams/${team.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {/* ロゴ */}
      <div className="mb-8 flex justify-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/rangers-logo-背景透過.png" alt="Rangers" width={36} height={36} className="object-contain" />
          <Image src="/rangers-name-背景透過.png" alt="Rangers" width={100} height={28} className="object-contain" />
        </Link>
      </div>

      {/* グループカード */}
      <div className="mb-6 rounded-2xl border border-[#dce3ea] bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#005F8C]">グループへの招待</p>
        <h1 className="mb-2 text-2xl font-bold text-[#1a2332]">{team.name}</h1>
        {team.description && (
          <p className="text-sm leading-relaxed text-[#475569]">{team.description}</p>
        )}
      </div>

      {user ? (
        /* ログイン済み：参加フォーム */
        <JoinForm
          inviteCode={inviteCode}
          teamName={team.name}
          hasAnnualFee={team.has_annual_fee ?? false}
          hasMonthlyFee={team.has_monthly_fee ?? false}
          hasPointCard={team.has_point_card ?? false}
          pointCardCount={team.point_card_count ?? 0}
        />
      ) : (
        /* 未ログイン：登録・ログインへ誘導 */
        <div className="space-y-3">
          <Link
            href={`/register?invite=${inviteCode}`}
            className="flex items-center justify-center rounded-full bg-[#005F8C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
            style={{ minHeight: "48px" }}
          >
            アカウントを作成してグループに参加
          </Link>
          <Link
            href={`/login?invite=${inviteCode}`}
            className="flex items-center justify-center rounded-full border border-[#dce3ea] bg-white px-6 py-3.5 text-sm font-semibold text-[#1a2332] transition-colors hover:border-[#005F8C]"
            style={{ minHeight: "48px" }}
          >
            ログインして参加
          </Link>
          <p className="text-center text-xs text-[#64748b]">
            アカウント登録・ログイン後、自動的にグループ参加画面に戻ります
          </p>
        </div>
      )}
    </div>
  )
}
