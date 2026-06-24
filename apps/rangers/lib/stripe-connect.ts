import "server-only"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://swim-os-seven.vercel.app"

/**
 * チームの Stripe Connected Account（Standard）を取得または新規作成する。
 * Account ID は teams.stripe_account_id に保存する。
 */
export async function getOrCreateConnectAccount(
  teamId: string,
  teamName: string,
  email: string
): Promise<string> {
  const admin = createAdminClient()

  const { data: team } = await admin
    .from("teams")
    .select("stripe_account_id")
    .eq("id", teamId)
    .single()

  if (team?.stripe_account_id) return team.stripe_account_id

  const account = await stripe.accounts.create({
    type: "standard",
    email,
    business_profile: { name: teamName },
    metadata: { team_id: teamId },
  })

  // stripe_account_id が null の行のみ更新（並行リクエストによる二重作成を防ぐ）
  const { data: saved } = await admin
    .from("teams")
    .update({ stripe_account_id: account.id })
    .eq("id", teamId)
    .is("stripe_account_id", null)
    .select("stripe_account_id")
    .maybeSingle()

  if (!saved) {
    // 別リクエストが先に書き込んだ場合: 今作成したアカウントを削除して既存値を返す
    await stripe.accounts.del(account.id).catch(() => null)
    const { data: existing } = await admin
      .from("teams")
      .select("stripe_account_id")
      .eq("id", teamId)
      .single()
    return existing?.stripe_account_id ?? account.id
  }

  return account.id
}

/**
 * Stripe Account Link を生成する（オンボーディング画面への URL）。
 */
export async function createAccountLink(accountId: string, teamId: string): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/api/stripe/connect/onboarding?teamId=${teamId}&refresh=true`,
    return_url: `${APP_URL}/api/stripe/connect/callback?teamId=${teamId}`,
    type: "account_onboarding",
  })
  return link.url
}

/**
 * Platform の手数料率を platform_settings テーブルから取得する。
 * 取得失敗時はデフォルト 10% を返す。
 */
export async function getPlatformFeePercent(): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "platform_fee_percent")
    .maybeSingle()
  const parsed = data ? parseFloat(data.value) : NaN
  return Number.isFinite(parsed) ? parsed : 10
}

/**
 * 課金金額から Platform 手数料と指導員受取額を計算する。
 * @param amount 課金総額（円）
 * @param feePercent 手数料率（%）
 */
export function calculateFees(
  amount: number,
  feePercent: number
): { platformFee: number; netAmount: number } {
  const platformFee = Math.floor((amount * feePercent) / 100)
  return { platformFee, netAmount: amount - platformFee }
}
