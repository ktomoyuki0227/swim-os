"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { PaymentMethod } from "@/types/database"
import type { Database, Json } from "@/types/database-generated"
import { getPlatformFeePercent, hasStripeConnect } from "@/lib/stripe-connect"
import { isTeamAdmin, getActiveTeamAdminIds } from "@/lib/auth/require-team-admin"
import { mapWithConcurrency } from "@/lib/utils"
import { formatSessionDateJa } from "@/lib/format-date"
import { notifyUser, notifyUsers } from "@/lib/notifications"
import { chargeSessionRegistrationStripe, refundSessionRegistrationStripe } from "@/lib/stripe-payment-helpers"
import { competitionEntrySchema } from "@/lib/validations"

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
  if (session.session_status !== "open") return { error: "受付中のセッションのみ開催確定できます" }

  // admin権限チェック
  if (!(await isTeamAdmin(confirmAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  // セッションステータスを条件付きUPDATEで原子的に open -> confirmed へ遷移させる。
  // ボタンの二重クリックや通信リトライで confirmSession が同時に2回呼ばれても、
  // 片方だけがこのUPDATEに成功し、もう片方は0件更新で即座に中断するため、
  // 決済処理の重複実行（＝参加者への二重課金）を防げる。
  const { data: claimed, error: claimErr } = await confirmAdmin
    .from("practice_sessions")
    .update({ session_status: "confirmed" })
    .eq("id", sessionId)
    .eq("session_status", "open")
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
        paymentErrors.push(`${reg.id}: stripe not configured`)
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

  // 確定後の中止の場合、返金・ポイント戻し
  if (session.session_status === "confirmed") {
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
        return { error: `返金処理中にエラーが発生しました（${refundErrors.length}件）` }
      }
    }
  }

  // セッションステータスを cancelled に（adminClientでRLSをバイパス）
  const { error: cancelErr } = await cancelAdmin
    .from("practice_sessions")
    .update({ session_status: "cancelled" })
    .eq("id", sessionId)

  if (cancelErr) return { error: "セッションの中止に失敗しました" }

  // 参加登録済みメンバーへ個別中止通知（中止操作者本人は除外）
  await notifySessionCancelled(cancelAdmin, sessionId, session, user.id)

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { success: true }
}

export async function registerForSession(
  sessionId: string,
  paymentMethod: PaymentMethod,
  competitionEntry?: Record<string, unknown>
) {
  if (competitionEntry !== undefined) {
    const parsed = competitionEntrySchema.safeParse(competitionEntry)
    if (!parsed.success) return { error: "入力値が不正です" }
    competitionEntry = parsed.data
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const adminClient = createAdminClient()

  // セッション情報を取得（adminClientでRLS自己参照をバイパス）
  // team: チームのfee_members_exempt_sessionを同時に取得して余分なクエリを避ける
  const { data: session } = await adminClient
    .from("practice_sessions")
    .select("*, team:teams(fee_members_exempt_session)")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }

  // メンバーシップ確認（adminClientでRLSをバイパス）
  const { data: membership } = await adminClient
    .from("team_members")
    .select("id, role, membership_type, stamp_remaining")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  const isMember = !!membership

  // 管理者は自チームのセッションに無料で参加（ロールベースで判定）
  const isAdmin = membership?.role === "admin"

  // 年会費・月謝会員の参加費免除判定（サーバー側で完結 — クライアントは操作不可）
  const isExempt =
    isAdmin ||
    (!!(session.team as { fee_members_exempt_session?: boolean } | null)?.fee_members_exempt_session &&
    isMember &&
    (membership?.membership_type === "annual" || membership?.membership_type === "monthly"))

  // 免除の場合は支払方法を cash に固定（クライアントが誤った値を送っても上書きする）
  const effectivePaymentMethod = isExempt ? "cash" : paymentMethod

  // 非外部セッションはグループメンバーのみ参加可
  if (!session.is_external && !isMember) {
    return { error: "このグループのメンバーではありません" }
  }

  // 締め切りチェック
  if (session.registration_deadline && new Date(session.registration_deadline) < new Date()) {
    return { error: "参加登録の締め切りを過ぎています" }
  }

  // ポイントカード残数チェック（免除の場合は effectivePaymentMethod = "cash" なのでスキップされる）
  if (effectivePaymentMethod === "point_card") {
    if (!membership || membership.membership_type !== "point_card") {
      return { error: "ポイントカード会員ではありません" }
    }
    if (!session.allow_point_card) {
      return { error: "このセッションではポイントカードを利用できません" }
    }
    if ((membership.stamp_remaining ?? 0) <= 0) {
      return { error: "ポイントカードの残回数が0です。追加購入してください。" }
    }
  }

  // 定員チェック + 参加登録（新規 or キャンセル済みレコードの再利用）を
  // register_for_session RPC 内で原子的に行う。practice_sessions 行を
  // ロックすることで、残り枠1に対して複数人が同時登録しても定員を
  // 超過しないようにする（従来はCOUNT確認とINSERTの間にウィンドウがあった）。
  const { error: registerErr } = await adminClient.rpc("register_for_session", {
    p_session_id: sessionId,
    p_swimmer_id: user.id,
    p_is_member: isMember,
    p_payment_method: effectivePaymentMethod,
    p_payment_status: isExempt ? "free" : "pending",
    p_competition_entry: (competitionEntry ?? null) as Json,
  })

  if (registerErr) {
    if (registerErr.message?.includes("session_not_open")) return { error: "このセッションは受付を終了しています" }
    if (registerErr.message?.includes("capacity_exceeded")) return { error: "定員に達しています" }
    if (registerErr.code === "23505") return { error: "既に参加登録済みです" }
    return { error: "参加登録に失敗しました" }
  }

  // 最小開催人数達成チェック → 管理者へ通知
  if (session.min_participants) {
    const { count: currentCount } = await adminClient
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", sessionId)
      .is("cancelled_at", null)
    if (currentCount !== null && currentCount === session.min_participants) {
      const minAdminIds = await getActiveTeamAdminIds(adminClient, session.team_id)
      if (minAdminIds.length > 0) {
        await notifyUsers(minAdminIds, {
          type: "session_min_reached",
          title: `「${session.title}」が最小開催人数に達しました`,
          body: `${session.min_participants}名が揃いました。開催確定できます`,
          team_id: session.team_id,
          link: `/sessions/${sessionId}`,
        })
      }
    }
  }

  // 参加者プロフィールを取得して管理者へ通知
  const { data: registrantProfile } = await adminClient
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()
  const teamAdminIds = await getActiveTeamAdminIds(adminClient, session.team_id, user.id)
  if (teamAdminIds.length > 0) {
    const scheduledDate = formatSessionDateJa(session.scheduled_at)
    await notifyUsers(teamAdminIds, {
      type: "session_registered",
      title: `${registrantProfile?.name ?? "メンバー"}さんが参加登録しました`,
      body: `「${session.title}」${scheduledDate}`,
      team_id: session.team_id,
      link: `/sessions/${sessionId}`,
    })
  }

  // 参加者本人への登録確認通知（管理者は自分のチームなので省略）
  if (!isAdmin) {
    const scheduledDate = formatSessionDateJa(session.scheduled_at)
    await notifyUser(user.id, {
      type: "session_registered",
      title: "参加登録が完了しました",
      body: `「${session.title}」${scheduledDate}`,
      team_id: session.team_id,
      link: `/teams/${session.team_id}/sessions/${sessionId}`,
    })
  }

  revalidatePath(`/teams`)
  revalidatePath("/notifications")
  return { success: true }
}

export async function cancelRegistration(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const adminClient = createAdminClient()

  const { data: registration } = await adminClient
    .from("session_registrations")
    .select("*, session:practice_sessions(*)")
    .eq("session_id", sessionId)
    .eq("swimmer_id", user.id)
    .is("cancelled_at", null)
    .single()

  if (!registration) return { error: "参加登録が見つかりません" }

  const session = registration.session

  // 開催確定後のキャンセル: 返金可否を判定してから後の単一書き込みで適用
  // Stripe 返金 / スタンプ戻しが失敗した場合はここで早期リターン（cancelled_at は未設定のまま）
  let newPaymentStatus: string | null = null

  if (session.session_status === "confirmed" && registration.payment_status === "paid") {
    if (registration.payment_method === "stripe" && registration.stripe_payment_intent_id) {
      // キャンセル規定に基づく返金判定
      const isRefundEligible =
        session.cancellation_days !== null &&
        new Date(session.scheduled_at).getTime() - Date.now() >=
          session.cancellation_days * 24 * 60 * 60 * 1000
      if (isRefundEligible && process.env.STRIPE_SECRET_KEY) {
        // Connect送金の判定・refunds.create・transfer_records更新はcancelSessionと同じ
        // 処理のため共通ヘルパーに集約している（判定条件・更新内容は変更していない）。
        const refundResult = await refundSessionRegistrationStripe({
          admin: adminClient,
          registrationId: registration.id,
          stripePaymentIntentId: registration.stripe_payment_intent_id,
          logPrefix: "[cancelRegistration]",
        })
        if (!refundResult.ok) {
          return { error: "返金処理に失敗しました。管理者にお問い合わせください" }
        }
        newPaymentStatus = "refunded"
      }
      // isRefundEligible = false の場合は payment_status = "paid" のまま（支払い済み・返金なし）
    } else if (registration.payment_method === "point_card") {
      // ポイント戻し（adminClientでRLSをバイパス・アトミックなSQL式で競合を防ぐ）
      const { error: stampErr } = await adminClient.rpc("increment_stamp", {
        p_session_id: sessionId,
        p_swimmer_id: user.id,
      })
      if (stampErr) {
        return { error: "スタンプの返却に失敗しました。管理者にお問い合わせください" }
      }
      newPaymentStatus = "refunded"
    }
  }

  // キャンセル記録と payment_status 更新を 1 回の書き込みで原子的に行う
  // これにより「Stripe返金済み + cancelled_at 未設定」のゾンビ状態を防ぐ
  const cancelUpdate: Database["public"]["Tables"]["session_registrations"]["Update"] = { cancelled_at: new Date().toISOString() }
  if (newPaymentStatus) cancelUpdate.payment_status = newPaymentStatus

  const { error: cancelWriteErr } = await adminClient
    .from("session_registrations")
    .update(cancelUpdate)
    .eq("id", registration.id)
  if (cancelWriteErr) return { error: "キャンセルの記録に失敗しました" }

  // 管理者へキャンセル通知
  const { data: cancellerProfile } = await adminClient
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()
  const cancelAdminIds = await getActiveTeamAdminIds(adminClient, session.team_id, user.id)
  if (cancelAdminIds.length > 0) {
    const scheduledDate = formatSessionDateJa(session.scheduled_at)
    await notifyUsers(cancelAdminIds, {
      type: "session_cancelled_by_member",
      title: `${cancellerProfile?.name ?? "メンバー"}さんがキャンセルしました`,
      body: `「${session.title}」${scheduledDate}`,
      team_id: session.team_id,
      link: `/sessions/${sessionId}`,
    })
  }

  // 定員キャンセル待ち通知: 定員ありセッションで空きが出た場合
  if (session.max_participants) {
    // adminClientで全件取得（user clientはRLSで自分の登録しか見えない）
    const { count } = await adminClient
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", sessionId)
      .is("cancelled_at", null)

    if (count !== null && count < session.max_participants) {
      // セッションの通知対象メンバーに空き通知を配信（adminClientでRLS自己参照をバイパス）
      const { data: targetMembers } = await adminClient
        .from("team_members")
        .select("swimmer_id, role")
        .eq("team_id", session.team_id)
        .eq("status", "active")

      if (targetMembers) {
        // 既に登録済みのユーザーは除外（adminClientで全件取得）
        const { data: existingRegs } = await adminClient
          .from("session_registrations")
          .select("swimmer_id")
          .eq("session_id", sessionId)
          .is("cancelled_at", null)

        const registeredIds = new Set(existingRegs?.map((r) => r.swimmer_id) || [])
        const notifyTargets = targetMembers.filter((m) => !registeredIds.has(m.swimmer_id))

        for (const target of notifyTargets) {
          const notifLink = target.role === "admin"
            ? `/sessions/${sessionId}`
            : `/teams/${session.team_id}/sessions/${sessionId}`
          await notifyUser(target.swimmer_id, {
            type: "waitlist_available",
            title: `空きが出ました: ${session.title}`,
            body: `「${session.title}」に空きが出ました。参加登録が可能です。`,
            team_id: session.team_id,
            link: notifLink,
          })
        }
      }
    }
  }

  revalidatePath("/teams")
  revalidatePath("/notifications")
  return { success: true }
}

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

  const { data: member } = await adminClient
    .from("team_members")
    .select("role")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  if (!member || member.role !== "admin") return { error: "管理者のみ操作できます" }

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
