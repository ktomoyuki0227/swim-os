"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getPlatformFeePercent, hasStripeConnect, hasBrokenStripeConnect } from "@/lib/stripe-connect"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { mapWithConcurrency } from "@/lib/utils"
import { formatSessionDateJa } from "@/lib/format-date"
import { notifyUser, notifyUsers } from "@/lib/notifications"
import { chargeSessionRegistrationStripe, refundSessionRegistrationStripe } from "@/lib/stripe-payment-helpers"

// confirmSession/cancelSession でのStripe決済・返金の同時実行数。参加者数が多い
// セッションでもサーバーレス関数のタイムアウトに収まるよう、完全な直列処理を避ける。
const STRIPE_OPERATION_CONCURRENCY = 5

type AdminClient = ReturnType<typeof createAdminClient>

/** 開催確定を、キャンセルしていない参加登録者全員(実行者本人を除く)へ通知する */
async function notifySessionConfirmed(
  admin: AdminClient,
  sessionId: string,
  session: { title: string; scheduled_at: string; team_id: string },
  excludeUserId: string
): Promise<void> {
  const { data: registrants } = await admin
    .from("session_registrations")
    .select("swimmer_id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .neq("swimmer_id", excludeUserId)
  if (!registrants || registrants.length === 0) return

  const scheduledDate = formatSessionDateJa(session.scheduled_at)
  await notifyUsers(registrants.map((r) => r.swimmer_id), {
    type: "session_confirmed",
    title: `「${session.title}」が開催確定しました`,
    body: `${scheduledDate}のセッションが開催確定です。忘れずにご参加ください`,
    team_id: session.team_id,
    link: `/teams/${session.team_id}/sessions/${sessionId}`,
  })
}

/** 中止を、キャンセルしていない参加登録者全員(実行者本人を除く)へ通知する */
async function notifySessionCancelled(
  admin: AdminClient,
  sessionId: string,
  session: { title: string; scheduled_at: string; team_id: string },
  excludeUserId: string
): Promise<void> {
  const { data: registrants } = await admin
    .from("session_registrations")
    .select("swimmer_id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .neq("swimmer_id", excludeUserId)
  if (!registrants || registrants.length === 0) return

  const scheduledDate = formatSessionDateJa(session.scheduled_at)
  await notifyUsers(registrants.map((r) => r.swimmer_id), {
    type: "session_cancelled",
    title: `「${session.title}」が中止になりました`,
    body: `${scheduledDate}に予定していたセッションが中止になりました`,
    team_id: session.team_id,
    link: `/teams/${session.team_id}/sessions/${sessionId}`,
  })
}

export async function confirmSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const confirmAdmin = createAdminClient()

  // セッション情報を取得
  const { data: session } = await confirmAdmin
    .from("practice_sessions")
    .select("*, team:teams(*)")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }
  // open: 締切未設定のまま受付中。closed: 締切通過済みで確定/中止の判断待ち。どちらからも確定できる。
  if (!["open", "closed"].includes(session.session_status)) {
    return { error: "受付中または受付終了のセッションのみ開催確定できます" }
  }

  // admin権限チェック
  if (!(await isTeamAdmin(confirmAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  // セッションステータスを条件付きUPDATEで原子的に open/closed -> confirmed へ遷移させる。
  // ボタンの二重クリックや通信リトライで confirmSession が同時に2回呼ばれても、
  // 片方だけがこのUPDATEに成功し、もう片方は0件更新で即座に中断するため、
  // 決済処理の重複実行（＝参加者への二重課金）を防げる。
  const { data: claimed, error: claimErr } = await confirmAdmin
    .from("practice_sessions")
    .update({ session_status: "confirmed" })
    .eq("id", sessionId)
    .in("session_status", ["open", "closed"])
    .select("id")
    .maybeSingle()
  if (claimErr || !claimed) return { error: "このセッションは既に開催確定処理が実行されています" }

  // 参加登録者を取得（pending のみ）
  // - 再実行しても二重課金しない
  // - payment_status = "free"（年会費・月謝免除）は課金不要のため除外
  // - paid / failed / refunded も除外
  const { data: registrations } = await confirmAdmin
    .from("session_registrations")
    .select("*")
    .eq("session_id", sessionId)
    .eq("payment_status", "pending")
    .is("cancelled_at", null)

  if (!registrations) return { error: "参加者情報の取得に失敗しました" }

  // Stripe Connect: チームの Connected Account 情報を取得
  const connectTeam = session.team as {
    stripe_account_id: string | null
    stripe_onboarding_completed: boolean
  } | null
  const hasConnect = hasStripeConnect(connectTeam)
  const feePercent = hasConnect && process.env.STRIPE_SECRET_KEY
    ? await getPlatformFeePercent()
    : 0

  // 決済処理（会員種別ごとに処理）
  const paymentErrors: string[] = []
  // 参加者ごとの決済は互いに独立しているため、一定の同時実行数で並行処理する
  // （完全な直列処理だと参加者数に比例して所要時間が伸び、タイムアウトに近づくため）
  const processRegistrationPayment = async (
    reg: (typeof registrations)[number]
  ): Promise<void> => {
    if (reg.payment_method === "stripe") {
      if (!process.env.STRIPE_SECRET_KEY) {
        // 他の失敗パス（決済情報未登録・RPC失敗・決済失敗）と同様、pendingのまま放置せず
        // failedに倒してretryPaymentで復旧可能にし、本人にも通知する
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "failed" })
          .eq("id", reg.id)
        await notifyUser(reg.swimmer_id, {
          type: "payment_failed",
          title: `「${session.title}」の参加費決済に失敗しました`,
          body: "決済処理が一時的に利用できません。しばらくしてから運営にお問い合わせください",
          team_id: session.team_id,
          link: "/payments",
        })
        paymentErrors.push(`${reg.id}: stripe not configured`)
        return
      }
      if (hasBrokenStripeConnect(connectTeam)) {
        // Connectアカウントは作成済みだが現在オンボーディング未完了(無効化・審査保留等)。
        // ここでtransfer_dataなしのまま決済すると全額がプラットフォーム残高に入り、
        // コーチへの送金が行われないまま気づかれにくい誤課金になるため、決済自体をブロックする
        // (account.updatedハンドラで管理者には別途通知済みだが、個別の決済もfailedにして
        // retryPaymentで復旧可能にする)
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "failed" })
          .eq("id", reg.id)
        await notifyUser(reg.swimmer_id, {
          type: "payment_failed",
          title: `「${session.title}」の参加費決済に失敗しました`,
          body: "運営者の決済アカウント連携に問題が発生しているため、決済を保留しています。運営にお問い合わせください",
          team_id: session.team_id,
          link: "/payments",
        })
        paymentErrors.push(`${reg.id}: broken stripe connect account`)
        return
      }
      const { data: swimmer } = await confirmAdmin
        .from("profiles")
        .select("stripe_customer_id, stripe_payment_method_id")
        .eq("id", reg.swimmer_id)
        .single()
      if (!swimmer?.stripe_customer_id || !swimmer?.stripe_payment_method_id) {
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "failed" })
          .eq("id", reg.id)
        await notifyUser(reg.swimmer_id, {
          type: "payment_failed",
          title: `「${session.title}」の参加費決済に失敗しました`,
          body: "お支払い情報が登録されていません。カード情報をご確認ください",
          team_id: session.team_id,
          link: "/payments",
        })
        paymentErrors.push(`${reg.id}: no stripe customer or payment method`)
        return
      }
      // charged_amount は登録時点でスナップショットした金額。開催確定前の料金変更が
      // 既存登録者への課金額に影響しないよう、現在価格ではなくこの値を優先する。
      // 古い登録(バックフィル分)でnullの場合のみ現在価格にフォールバックする。
      const amount = reg.charged_amount ?? (reg.is_member ? session.member_price : session.guest_price)
      const result = await chargeSessionRegistrationStripe({
        admin: confirmAdmin,
        registrationId: reg.id,
        swimmerId: reg.swimmer_id,
        sessionId,
        sessionTitle: session.title,
        teamId: session.team_id,
        amount,
        stripeCustomerId: swimmer.stripe_customer_id,
        stripePaymentMethodId: swimmer.stripe_payment_method_id,
        connectAccountId: hasConnect ? (connectTeam?.stripe_account_id ?? null) : null,
        feePercent,
      })
      if (!result.ok) paymentErrors.push(`${reg.id}: ${result.error}`)
    } else if (reg.payment_method === "point_card") {
      // ポイントカード消費（adminClientでRLSをバイパス）
      const { error: rpcErr } = await confirmAdmin.rpc("decrement_stamp", {
        p_session_id: sessionId,
        p_swimmer_id: reg.swimmer_id,
      })
      if (rpcErr) {
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "failed" })
          .eq("id", reg.id)
        await notifyUser(reg.swimmer_id, {
          type: "payment_failed",
          title: `「${session.title}」の回数券処理に失敗しました`,
          body: "回数券の使用処理中にエラーが発生しました。残枚数をご確認ください",
          team_id: session.team_id,
          link: "/payments",
        })
        paymentErrors.push(`${reg.id}: stamp decrement failed`)
        return
      }
      const { error: payErr } = await confirmAdmin
        .from("session_registrations")
        .update({ payment_status: "paid" })
        .eq("id", reg.id)
      if (payErr) {
        paymentErrors.push(`${reg.id}: point_card status update failed`)
      } else {
        // 回数券使用通知（本人へ）
        await notifyUser(reg.swimmer_id, {
          type: "payment_charged",
          title: `「${session.title}」の回数券を使用しました`,
          body: "回数券1枚が使用されました",
          team_id: session.team_id,
          link: "/payments",
        })
        // 残枚数確認 → 2枚以下なら残少通知
        const { data: updatedMember } = await confirmAdmin
          .from("team_members")
          .select("stamp_remaining")
          .eq("team_id", session.team_id)
          .eq("swimmer_id", reg.swimmer_id)
          .single()
        if (updatedMember && updatedMember.stamp_remaining !== null && updatedMember.stamp_remaining <= 2) {
          await notifyUser(reg.swimmer_id, {
            type: "stamp_low",
            title: "回数券の残枚数が少なくなっています",
            body: `残り${updatedMember.stamp_remaining}枚です。お早めに追加購入をご検討ください`,
            team_id: session.team_id,
            link: `/teams/${session.team_id}`,
          })
        }
      }
    }
    // cash はそのまま（当日回収）
  }

  await mapWithConcurrency(registrations, STRIPE_OPERATION_CONCURRENCY, async (reg) => {
    // Supabase呼び出し以外の予期しない例外（ネットワーク断等）がここで発生すると、
    // try-catchなしでは mapWithConcurrency 内の Promise.all 全体がrejectし、
    // 他の参加者の決済処理まで巻き込んで中断してしまう。1件の例外を握りつぶさず
    // paymentErrors に積んで処理を継続できるよう、コールバック全体を保護する。
    try {
      await processRegistrationPayment(reg)
    } catch (err) {
      console.error(`[confirmSession] Unexpected error processing registration ${reg.id}:`, err)
      paymentErrors.push(`${reg.id}: unexpected error`)
    }
  })

  // セッションステータスは決済処理の前に既に "confirmed" へ原子的に更新済み
  // （決済失敗があっても確定済みのまま残し、リトライ可能にする）

  // 参加登録済みメンバーへ開催確定通知
  await notifySessionConfirmed(confirmAdmin, sessionId, session, user.id)

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  if (paymentErrors.length > 0) {
    return { success: true, failedPayments: paymentErrors.length }
  }
  return { success: true }
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const cancelAdmin = createAdminClient()
  const { data: session } = await cancelAdmin
    .from("practice_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }
  if (session.session_status === "cancelled") return { error: "既に中止済みのセッションです" }

  // admin権限チェック
  if (!(await isTeamAdmin(cancelAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  const originalStatus = session.session_status

  // confirmSessionと同様、条件付きUPDATEで原子的に現在のステータス -> cancelled へ
  // 遷移させる。ボタンの二重クリックや通信リトライでcancelSessionが同時に2回呼ばれても、
  // 片方だけがこのUPDATEに成功し、もう片方は0件更新で即座に中断するため、
  // 返金・ポイント戻し処理の重複実行（＝二重返金・二重付与）を防げる。
  const { data: claimed, error: claimErr } = await cancelAdmin
    .from("practice_sessions")
    .update({ session_status: "cancelled" })
    .eq("id", sessionId)
    .eq("session_status", originalStatus)
    .select("id")
    .maybeSingle()
  if (claimErr || !claimed) return { error: "このセッションは既に中止処理が実行されています" }

  // 確定後の中止の場合、返金・ポイント戻し
  if (originalStatus === "confirmed") {
    const { data: registrations } = await cancelAdmin
      .from("session_registrations")
      .select("*")
      .eq("session_id", sessionId)
      .eq("payment_status", "paid")

    if (registrations) {
      const refundErrors: string[] = []
      // confirmSessionと同様、参加者ごとの返金は互いに独立しているため
      // 完全な直列処理を避け、一定の同時実行数で並行処理する
      const processRefund = async (reg: (typeof registrations)[number]): Promise<void> => {
        if (reg.payment_method === "stripe" && reg.stripe_payment_intent_id) {
          if (!process.env.STRIPE_SECRET_KEY) {
            refundErrors.push(`${reg.id}: stripe not configured, refund skipped`)
            return
          }
          const refundResult = await refundSessionRegistrationStripe({
            admin: cancelAdmin,
            registrationId: reg.id,
            stripePaymentIntentId: reg.stripe_payment_intent_id,
            logPrefix: "[cancelSession]",
          })
          if (!refundResult.ok) {
            refundErrors.push(`${reg.id}: ${refundResult.error}`)
            return
          }
          const { error: refErr } = await cancelAdmin
            .from("session_registrations")
            .update({ payment_status: "refunded" })
            .eq("id", reg.id)
          if (refErr) refundErrors.push(`${reg.id}: refunded status update failed`)
        } else if (reg.payment_method === "point_card") {
          // ポイント戻し（adminClientでRLSをバイパス）
          const { error: rpcErr } = await cancelAdmin.rpc("increment_stamp", {
            p_session_id: sessionId,
            p_swimmer_id: reg.swimmer_id,
          })
          if (rpcErr) {
            refundErrors.push(`${reg.id}: stamp increment failed`)
            return
          }
          const { error: refErr } = await cancelAdmin
            .from("session_registrations")
            .update({ payment_status: "refunded" })
            .eq("id", reg.id)
          if (refErr) refundErrors.push(`${reg.id}: point_card refund status update failed`)
        }
      }

      await mapWithConcurrency(registrations, STRIPE_OPERATION_CONCURRENCY, async (reg) => {
        try {
          await processRefund(reg)
        } catch (err) {
          console.error(`[cancelSession] Unexpected error refunding registration ${reg.id}:`, err)
          refundErrors.push(`${reg.id}: unexpected error`)
        }
      })

      if (refundErrors.length > 0) {
        // 返金に失敗したまま cancelled 確定にはせず、上のclaimで進めたステータスを
        // 元に戻して中止処理自体を再試行できるようにする
        await cancelAdmin
          .from("practice_sessions")
          .update({ session_status: originalStatus })
          .eq("id", sessionId)
        return { error: `返金処理中にエラーが発生しました（${refundErrors.length}件）` }
      }
    }
  }

  // セッションステータスは返金処理の前に既に上のclaimで cancelled へ原子的に更新済み

  // 参加登録済みメンバーへ個別中止通知（中止操作者本人は除外）
  await notifySessionCancelled(cancelAdmin, sessionId, session, user.id)

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { success: true }
}
