import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

/**
 * GET /api/stripe/connect/callback?teamId=xxx
 * Stripe オンボーディング完了後のコールバック
 * charges_enabled を確認して teams.stripe_onboarding_completed を更新する
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("teamId")

  if (!teamId) {
    return NextResponse.redirect(new URL("/teams", req.url))
  }

  // 認証チェック（未ログインはログインページへ）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL(`/teams/${teamId}?connectError=true`, req.url))
  }

  const admin = createAdminClient()

  const { data: team } = await admin
    .from("teams")
    .select("stripe_account_id")
    .eq("id", teamId)
    .single()

  if (!team?.stripe_account_id) {
    return NextResponse.redirect(new URL(`/teams/${teamId}?connectError=true`, req.url))
  }

  try {
    const account = await stripe.accounts.retrieve(team.stripe_account_id)
    const completed = account.charges_enabled && account.details_submitted

    await admin
      .from("teams")
      .update({ stripe_onboarding_completed: completed })
      .eq("id", teamId)

    if (completed) {
      return NextResponse.redirect(
        new URL(`/teams/${teamId}?connectSuccess=true`, req.url)
      )
    } else {
      // オンボーディング未完了（中断して戻ってきた）
      return NextResponse.redirect(
        new URL(`/teams/${teamId}?connectPending=true`, req.url)
      )
    }
  } catch (err) {
    console.error("[connect/callback] Failed to retrieve account:", err)
    return NextResponse.redirect(
      new URL(`/teams/${teamId}?connectError=true`, req.url)
    )
  }
}
