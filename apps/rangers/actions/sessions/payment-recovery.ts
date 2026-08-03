"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getPlatformFeePercent, hasStripeConnect, hasBrokenStripeConnect } from "@/lib/stripe-connect"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { notifyUser } from "@/lib/notifications"
import { chargeSessionRegistrationStripe } from "@/lib/stripe-payment-helpers"

export async function retryPayment(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const retryAdmin = createAdminClient()
  const { data: registration } = await retryAdmin
    .from("session_registrations")
    .select("*, session:practice_sessions(*)")
    .eq("id", registrationId)
    .single()

  if (!registration) return { error: "登録情報が見つかりません" }
  if (registration.payment_status !== "failed") return { error: "決済失敗のステータスではありません" }

  // admin権限チェック
  if (!registration.session) return { error: "セッション情報が見つかりません" }
  const session = registration.session as { team_id: string; session_status: string }
  if (session.session_status !== "confirmed") {
    return { error: "確定済みセッションの登録のみ再決済できます" }
  }
  if (!(await isTeamAdmin(retryAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  if (registration.payment_method === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "Stripe未設定環境では再決済できません" }
    }

    // payment_status を条件付きUPDATEで原子的に failed -> pending へ遷移させる。
    // confirmSessionと同様、retryPaymentが同時に2回呼ばれても片方だけが成功し、
    // もう片方は0件更新で即座に中断するため、再決済の重複実行を防げる。
    const { data: claimed, error: claimErr } = await retryAdmin
      .from("session_registrations")
      .update({ payment_status: "pending" })
      .eq("id", registrationId)
      .eq("payment_status", "failed")
      .select("id")
      .maybeSingle()
    if (claimErr || !claimed) return { error: "既に再決済処理が実行されています" }

    // 新規PaymentIntentを作成する前に、既存PIが実際にはStripe側で成功していないかを確認する。
    // confirm() がネットワークタイムアウト等で例外を投げた場合、Stripe側では決済が成立して
    // いるのにローカルでは "failed" のまま残ることがある。この状態確認をせずに新規PIを
    // 作成すると、既に成功している決済に加えてもう一度カードへ請求してしまう(二重課金)。
    if (registration.stripe_payment_intent_id) {
      const existingPi = await stripe.paymentIntents
        .retrieve(registration.stripe_payment_intent_id)
        .catch(() => null)
      if (existingPi?.status === "succeeded") {
        // Stripe側は既に成功済み → 新規課金はせずDBをこの事実に合わせて同期する。
        // transfer_records も同時に同期しないと、confirm()の例外パスで"failed"のまま
        // 残った送金記録が返金時のreverse_transfer判定漏れ(資金不整合)につながる。
        await retryAdmin
          .from("session_registrations")
          .update({ payment_status: "paid" })
          .eq("id", registrationId)
        await retryAdmin
          .from("transfer_records")
          .update({ status: "succeeded" })
          .eq("stripe_payment_intent_id", registration.stripe_payment_intent_id)
          .neq("status", "succeeded")
        revalidatePath("/sessions")
        revalidatePath("/notifications")
        return { success: true }
      }
      if (existingPi && ["processing", "requires_confirmation", "requires_capture"].includes(existingPi.status)) {
        // 処理中で結果が確定していない → 新規PIを作ると二重課金の恐れがあるため中断し、
        // pending のまま握りつぶさず failed に戻して再試行可能な状態を維持する
        await retryAdmin.from("session_registrations").update({ payment_status: "failed" }).eq("id", registrationId)
        return { error: "前回の決済がまだ処理中です。しばらく待ってから再度お試しください" }
      }
    }

    const { data: swimmer } = await retryAdmin
      .from("profiles")
      .select("stripe_customer_id, stripe_payment_method_id")
      .eq("id", registration.swimmer_id)
      .single()
    if (!swimmer?.stripe_customer_id || !swimmer?.stripe_payment_method_id) {
      // "pending" のまま放置すると再試行できなくなるため "failed" に戻す
      await retryAdmin.from("session_registrations").update({ payment_status: "failed" }).eq("id", registrationId)
      return { error: "カード情報が登録されていません" }
    }
    const retrySession = registration.session as { title: string; member_price: number; guest_price: number; team_id: string; session_status: string }
    const amount = registration.charged_amount ?? (registration.is_member ? retrySession.member_price : retrySession.guest_price)

    // Connect 設定を確認（再決済時も同様に送金）
    const { data: retryTeam } = await retryAdmin
      .from("teams")
      .select("stripe_account_id, stripe_onboarding_completed")
      .eq("id", retrySession.team_id)
      .single()

    if (hasBrokenStripeConnect(retryTeam)) {
      // confirmSessionと同様、Connectアカウントが壊れた状態での送金なし決済を防ぐ
      await retryAdmin.from("session_registrations").update({ payment_status: "failed" }).eq("id", registrationId)
      return { error: "運営者の決済アカウント連携に問題が発生しているため、再決済できません" }
    }

    const retryHasConnect = hasStripeConnect(retryTeam)
    const retryFeePercent = retryHasConnect ? await getPlatformFeePercent() : 0

    const result = await chargeSessionRegistrationStripe({
      admin: retryAdmin,
      registrationId,
      swimmerId: registration.swimmer_id,
      sessionId: registration.session_id,
      sessionTitle: retrySession.title,
      teamId: retrySession.team_id,
      amount,
      stripeCustomerId: swimmer.stripe_customer_id,
      stripePaymentMethodId: swimmer.stripe_payment_method_id,
      connectAccountId: retryHasConnect ? (retryTeam?.stripe_account_id ?? null) : null,
      feePercent: retryFeePercent,
    })
    if (!result.ok) {
      if (result.error === "stripe payment intent creation failed") return { error: "再決済の準備に失敗しました" }
      if (result.error === "failed to save payment intent id") return { error: "再決済の準備中にエラーが発生しました" }
      return { error: "再決済に失敗しました" }
    }
  }

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { success: true }
}

// 現金払いを集金済みにマーク（管理者のみ）
export async function markCashPaid(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "認証が必要です" }

  const adminClient = createAdminClient()

  const { data: reg, error: regError } = await adminClient
    .from("session_registrations")
    .select("session_id, swimmer_id, payment_method, payment_status, is_member, charged_amount, session:practice_sessions!inner(team_id, title, member_price, guest_price)")
    .eq("id", registrationId)
    .single()

  if (regError || !reg) return { error: "参加登録が見つかりません" }
  if (reg.payment_method !== "cash") return { error: "現金払い以外は変更できません" }
  if (reg.payment_status === "paid") return { error: "すでに集金済みです" }
  if (reg.payment_status !== "pending") return { error: "未払いの登録のみ変更できます" }

  const session = reg.session

  if (!(await isTeamAdmin(adminClient, session.team_id, user.id))) return { error: "管理者のみ操作できます" }

  const { error } = await adminClient
    .from("session_registrations")
    .update({ payment_status: "paid" })
    .eq("id", registrationId)

  if (error) return { error: "更新に失敗しました" }

  const chargedAmount = reg.charged_amount ?? (reg.is_member ? (session.member_price || 0) : (session.guest_price || 0))
  await notifyUser(reg.swimmer_id, {
    type: "payment_charged",
    title: `「${session.title}」の現金参加費を受領しました`,
    body: `¥${chargedAmount.toLocaleString()}の集金が確認されました`,
    team_id: session.team_id,
    link: "/payments",
  })

  revalidatePath(`/sessions/${reg.session_id}`)
  revalidatePath("/notifications")
  return { data: null }
}

// 現金払いの集金済みステータスを未回収に戻す（管理者のみ）。
// 誤って別の参加者を集金済みにしてしまった場合の取り消し用。
export async function unmarkCashPaid(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "認証が必要です" }

  const adminClient = createAdminClient()

  const { data: reg, error: regError } = await adminClient
    .from("session_registrations")
    .select("session_id, swimmer_id, payment_method, payment_status, session:practice_sessions!inner(team_id, title)")
    .eq("id", registrationId)
    .single()

  if (regError || !reg) return { error: "参加登録が見つかりません" }
  if (reg.payment_method !== "cash") return { error: "現金払い以外は変更できません" }
  if (reg.payment_status !== "paid") return { error: "集金済みの登録のみ取り消せます" }

  const session = reg.session

  if (!(await isTeamAdmin(adminClient, session.team_id, user.id))) return { error: "管理者のみ操作できます" }

  const { error } = await adminClient
    .from("session_registrations")
    .update({ payment_status: "pending" })
    .eq("id", registrationId)

  if (error) return { error: "更新に失敗しました" }

  await notifyUser(reg.swimmer_id, {
    type: "payment_reverted",
    title: `「${session.title}」の現金参加費の集金記録を取り消しました`,
    body: "受領記録に誤りがあったため未回収に戻しました。当日改めてお支払いください",
    team_id: session.team_id,
    link: "/payments",
  })

  revalidatePath(`/sessions/${reg.session_id}`)
  revalidatePath("/notifications")
  return { data: null }
}
