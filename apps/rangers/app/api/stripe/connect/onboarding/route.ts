import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getOrCreateConnectAccount, createAccountLink } from "@/lib/stripe-connect"
import { requireApiUser, requireRedirectUser } from "@/lib/auth/require-api-user"

export const dynamic = "force-dynamic"

/**
 * POST /api/stripe/connect/onboarding
 * Body: { teamId: string }
 * → Stripe Connected Account を取得/作成し、オンボーディング URL を返す
 *
 * GET /api/stripe/connect/onboarding?teamId=xxx&refresh=true
 * → Account Link の有効期限切れ時のリフレッシュ（Stripe がリダイレクトしてくる）
 */
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
  }

  const { user, response } = await requireApiUser()
  if (response) return response

  let teamId: string
  try {
    const body = await req.json()
    teamId = body.teamId
    if (!teamId) throw new Error("teamId is required")
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const admin = createAdminClient()

  // admin 権限チェック
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  // チーム情報を取得（email は coaches の email を使用）
  const { data: team } = await admin
    .from("teams")
    .select("name, stripe_account_id")
    .eq("id", teamId)
    .single()
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

  const { data: authData } = await admin.auth.admin.getUserById(user.id)
  const email = authData?.user?.email ?? ""

  try {
    const accountId = await getOrCreateConnectAccount(teamId, team.name, email)
    const url = await createAccountLink(accountId, teamId)
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[connect/onboarding] Failed to create account link:", err)
    return NextResponse.json({ error: "Failed to create onboarding link" }, { status: 500 })
  }
}

/** Stripe がリダイレクトしてくる Account Link 期限切れのリフレッシュ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("teamId")
  const isRefresh = searchParams.get("refresh") === "true"

  if (!teamId || !isRefresh) {
    return NextResponse.redirect(new URL("/teams", req.url))
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL(`/teams/${teamId}?connectError=true`, req.url))
  }

  const { user, response } = await requireRedirectUser(new URL("/login", req.url))
  if (response) return response

  const admin = createAdminClient()

  // admin 権限チェック（POST と同様。teamId は公開ページ等で第三者にも把握され得るため必須）
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) {
    return NextResponse.redirect(new URL(`/teams/${teamId}?connectError=true`, req.url))
  }

  const { data: team } = await admin
    .from("teams")
    .select("name, stripe_account_id")
    .eq("id", teamId)
    .single()
  if (!team?.stripe_account_id) {
    return NextResponse.redirect(new URL(`/teams/${teamId}?connectError=true`, req.url))
  }

  const { data: authData } = await admin.auth.admin.getUserById(user.id)
  const email = authData?.user?.email ?? ""

  try {
    const accountId = await getOrCreateConnectAccount(teamId, team.name, email)
    const url = await createAccountLink(accountId, teamId)
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(new URL(`/teams/${teamId}?connectError=true`, req.url))
  }
}
