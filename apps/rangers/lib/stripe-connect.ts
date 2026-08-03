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
    country: "JP",
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
  if (!Number.isFinite(parsed)) return 10
  // 設定ミスで負値や100超が入っても不正な手数料計算に繋がらないようクランプする
  return Math.min(100, Math.max(0, parsed))
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

/**
 * チームが Stripe Connect での送金を受け取れる状態かどうかを判定する。
 * Connected Account が作成済みかつオンボーディングが完了している場合のみ true。
 */
export function hasStripeConnect(
  team: { stripe_account_id: string | null; stripe_onboarding_completed: boolean | null } | null | undefined
): boolean {
  return !!(team?.stripe_account_id && team?.stripe_onboarding_completed)
}

/**
 * チームが過去にConnectアカウントを作成した(stripe_account_idがある)にもかかわらず、
 * 現在オンボーディングが完了していない状態かどうかを判定する。この状態のまま決済すると
 * transfer_dataなしで全額がプラットフォーム残高に入り、コーチへの送金が行われないまま
 * 気づかれにくい「誤課金」になるため、hasStripeConnectとは別に検知し、呼び出し元で
 * 決済をブロックする判断に使う。stripe_account_id自体が無い(Connectを一度も使っていない)
 * チームは対象外（現金/カード決済のみで運用する正常な構成のため）。
 */
export function hasBrokenStripeConnect(
  team: { stripe_account_id: string | null; stripe_onboarding_completed: boolean | null } | null | undefined
): boolean {
  return !!(team?.stripe_account_id && !team?.stripe_onboarding_completed)
}
