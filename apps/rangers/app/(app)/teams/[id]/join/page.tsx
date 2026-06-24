export const dynamic = "force-dynamic"

import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { JoinForm } from "./join-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamJoinPage({ params }: PageProps) {
  const { id } = await params

  const admin = createAdminClient()
  const { data: team } = await admin
    .from("teams")
    .select("id, name, description, avatar_url, has_annual_fee, has_monthly_fee, has_point_card, annual_fee_amount, monthly_fee_amount, point_card_count, point_card_price")
    .eq("id", id)
    .eq("status", "active")
    .single()

  if (!team) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // 既にアクティブなメンバーなら即リダイレクト
    const { data: existing } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("swimmer_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (existing) {
      redirect(`/teams/${team.id}`)
    }

    // 既に申請中なら申請済み画面を表示
    const { data: pendingRequest } = await admin
      .from("join_requests")
      .select("id, created_at")
      .eq("team_id", team.id)
      .eq("swimmer_id", user.id)
      .eq("status", "pending")
      .maybeSingle()

    if (pendingRequest) {
      return (
        <div className="mx-auto max-w-md py-4">
          <div className="mb-6 rounded-2xl border border-[#dce3ea] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#dce3ea] bg-[#e8f2f8]">
                {team.avatar_url ? (
                  <Image src={team.avatar_url} alt={team.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">🏊</div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1a2332]">{team.name}</h1>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#f0b429] bg-[#fffbf0] p-5 text-center">
            <div className="mb-3 text-3xl">⏳</div>
            <p className="font-semibold text-[#1a2332]">参加申請中です</p>
            <p className="mt-1 text-sm text-[#5c6a7a]">
              管理者が申請を確認しています。承認されると通知が届きます。
            </p>
            <p className="mt-2 text-xs text-[#8d99a8]">
              申請日: {new Date(pendingRequest.created_at).toLocaleDateString("ja-JP")}
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href={`/teams/${team.id}`} className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
              ← グループページに戻る
            </Link>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="mx-auto max-w-md py-4">
      {/* グループカード */}
      <div className="mb-6 rounded-2xl border border-[#dce3ea] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#dce3ea] bg-[#e8f2f8]">
            {team.avatar_url ? (
              <Image src={team.avatar_url} alt={team.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">🏊</div>
            )}
          </div>
          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[#005F8C]">
              入会申請
            </p>
            <h1 className="text-xl font-bold text-[#1a2332]">{team.name}</h1>
          </div>
        </div>
        {team.description && (
          <p className="text-sm leading-relaxed text-[#5c6a7a]">{team.description}</p>
        )}
      </div>

      {user ? (
        <JoinForm
          teamId={team.id}
          teamName={team.name}
          hasAnnualFee={team.has_annual_fee ?? false}
          hasMonthlyFee={team.has_monthly_fee ?? false}
          hasPointCard={team.has_point_card ?? false}
          annualFeeAmount={team.annual_fee_amount ?? null}
          monthlyFeeAmount={team.monthly_fee_amount ?? null}
          pointCardCount={team.point_card_count ?? 0}
          pointCardPrice={team.point_card_price ?? null}
        />
      ) : (
        <div className="space-y-3">
          <Link
            href={`/register?redirect=/teams/${team.id}/join`}
            className="flex items-center justify-center rounded-full bg-[#005F8C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
            style={{ minHeight: "48px" }}
          >
            アカウントを作成してグループに参加
          </Link>
          <Link
            href={`/login?redirect=/teams/${team.id}/join`}
            className="flex items-center justify-center rounded-full border border-[#dce3ea] bg-white px-6 py-3.5 text-sm font-semibold text-[#1a2332] transition-colors hover:border-[#005F8C]"
            style={{ minHeight: "48px" }}
          >
            ログインして参加
          </Link>
          <p className="text-center text-xs text-[#8d99a8]">
            アカウント登録・ログイン後、自動的にグループ参加画面に戻ります
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href={`/teams/${team.id}`}
          className="text-sm text-[#5c6a7a] hover:text-[#1a2332]"
        >
          ← グループページに戻る
        </Link>
      </div>
    </div>
  )
}
