"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sessionSchema, sessionUpdateSchema } from "@/lib/validations"
import type { PaymentMethod, CompetitionField } from "@/types/database"
import { getPlatformFeePercent, calculateFees } from "@/lib/stripe-connect"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { mapWithConcurrency } from "@/lib/utils"
import { notifyUser, notifyUsers } from "@/lib/notifications"

// confirmSession でのStripe決済の同時実行数。参加者数が多いセッションでも
// サーバーレス関数のタイムアウトに収まるよう、完全な直列処理を避ける。
const CONFIRM_PAYMENT_CONCURRENCY = 5

export async function createSession(teamId: string, data: unknown) {
  const parsed = sessionSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（adminClientでRLSをバイパス）
  const adminClient = createAdminClient()
  if (!(await isTeamAdmin(adminClient, teamId, user.id))) return { error: "権限がありません" }

  // RLS の自己参照ポリシーをバイパスするため adminClient で INSERT
  const { data: session, error } = await adminClient
    .from("practice_sessions")
    .insert({
      team_id: teamId,
      coach_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      content: parsed.data.content || null,
      type: parsed.data.type,
      scheduled_at: new Date(parsed.data.scheduled_at + '+09:00').toISOString(),
      end_at: parsed.data.end_at ? new Date(parsed.data.end_at + '+09:00').toISOString() : null,
      location: parsed.data.location,
      meeting_point: parsed.data.meeting_point || null,
      gender_filter: parsed.data.gender_filter || "all",
      member_price: parsed.data.member_price,
      guest_price: parsed.data.guest_price,
      registration_deadline: parsed.data.registration_deadline
        ? new Date(parsed.data.registration_deadline + '+09:00').toISOString()
        : null,
      min_participants: parsed.data.min_participants || null,
      max_participants: parsed.data.max_participants || null,
      course_rules: parsed.data.course_rules || null,
      target_tags: parsed.data.target_tags,
      target_members: parsed.data.target_members || null,
      cancellation_days: parsed.data.cancellation_days || null,
      allow_point_card: parsed.data.allow_point_card,
      is_external: parsed.data.is_external,
      competition_fields: parsed.data.competition_fields || null,
    })
    .select()
    .single()

  if (error) return { error: `セッションの作成に失敗しました: ${error.message}` }

  // チームの全メンバー（管理者除く）に新規セッション通知
  const { data: members } = await adminClient
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", teamId)
    .eq("status", "active")
    .neq("role", "admin")
  if (members && members.length > 0) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Tokyo",
    })
    try {
      const { error: notifError } = await notifyUsers(
        members.map((m) => m.swimmer_id),
        {
          type: "session_added",
          title: `新しいセッションが追加されました`,
          body: `「${session.title}」${scheduledDate}`,
          team_id: teamId,
          link: `/teams/${teamId}/sessions/${session.id}`,
        }
      )
      if (notifError) console.error("[createSession] notification insert failed:", notifError)
    } catch (err) {
      console.error("[createSession] notification insert threw:", err)
    }
  }

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { data: session }
}

export async function updateSession(sessionId: string, data: unknown) {
  const parsed = sessionUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const updateAdmin = createAdminClient()
  const { data: session } = await updateAdmin
    .from("practice_sessions")
    .select("team_id, session_status, title, scheduled_at, location")
    .eq("id", sessionId)
    .single()
  if (!session) return { error: "セッションが見つかりません" }

  if (!(await isTeamAdmin(updateAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  // 開催確定済みセッションの料金変更を禁止
  // （確定後は Stripe PI の決済済み金額と乖離するため）
  const updateData = { ...parsed.data }
  if (session.session_status === "confirmed") {
    delete updateData.member_price
    delete updateData.guest_price
  }
  // datetime-local値はタイムゾーン情報がないためJSTとして解釈してUTCに変換
  if (updateData.scheduled_at) {
    updateData.scheduled_at = new Date(updateData.scheduled_at + '+09:00').toISOString()
  }
  if (updateData.end_at) {
    updateData.end_at = new Date(updateData.end_at + '+09:00').toISOString()
  }
  if (updateData.registration_deadline) {
    updateData.registration_deadline = new Date(updateData.registration_deadline + '+09:00').toISOString()
  }

  // adminClientでRLSをバイパスして更新（user clientだとサイレントブロックの可能性あり）
  const { error } = await updateAdmin
    .from("practice_sessions")
    .update(updateData)
    .eq("id", sessionId)

  if (error) return { error: "セッションの更新に失敗しました" }

  // 日時・場所・タイトルが変更された場合、参加登録済みメンバーへ通知
  const hasImportantChange =
    (parsed.data.title && parsed.data.title !== session.title) ||
    (parsed.data.scheduled_at &&
      new Date(parsed.data.scheduled_at + '+09:00').toISOString() !== new Date(session.scheduled_at).toISOString()) ||
    (parsed.data.location && parsed.data.location !== session.location)

  if (hasImportantChange) {
    const { data: registrants } = await updateAdmin
      .from("session_registrations")
      .select("swimmer_id")
      .eq("session_id", sessionId)
      .is("cancelled_at", null)
    if (registrants && registrants.length > 0) {
      const sessionTitle = parsed.data.title ?? session.title
      await notifyUsers(registrants.map((r) => r.swimmer_id), {
        type: "session_updated",
        title: `「${sessionTitle}」の内容が変更されました`,
        body: "日時・場所などの情報が更新されています。ご確認ください",
        team_id: session.team_id,
        link: `/teams/${session.team_id}/sessions/${sessionId}`,
      })
    }
  }

  revalidatePath("/sessions")
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/notifications")
  return { success: true }
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: session } = await createAdminClient()
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .single()
  if (!session) return { error: "セッションが見つかりません" }

  if (!(await isTeamAdmin(createAdminClient(), session.team_id, user.id))) return { error: "権限がありません" }

  const adminClient = createAdminClient()

  // 参加者がいるか確認
  const { data: registrations } = await adminClient
    .from("session_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)

  if (registrations && registrations.length > 0) {
    return { error: `${registrations.length}名が参加登録済みです。先にセッションを中止してください。` }
  }

  const { error } = await adminClient
    .from("practice_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) return { error: "セッションの削除に失敗しました" }

  revalidatePath("/sessions")
  return { success: true }
}

export async function confirmSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // セッション情報を取得
  const { data: session } = await createAdminClient()
    .from("practice_sessions")
    .select("*, team:teams(*)")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }
  if (session.session_status !== "open") return { error: "受付中のセッションのみ開催確定できます" }

  // admin権限チェック
  if (!(await isTeamAdmin(createAdminClient(), session.team_id, user.id))) return { error: "権限がありません" }

  const confirmAdmin = createAdminClient()

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
  const hasConnect = !!(connectTeam?.stripe_account_id && connectTeam?.stripe_onboarding_completed)
  const feePercent = hasConnect && process.env.STRIPE_SECRET_KEY
    ? await getPlatformFeePercent()
    : 0

  // 決済処理（会員種別ごとに処理）
  const paymentErrors: string[] = []
  // 参加者ごとの決済は互いに独立しているため、一定の同時実行数で並行処理する
  // （完全な直列処理だと参加者数に比例して所要時間が伸び、タイムアウトに近づくため）
  await mapWithConcurrency(registrations, CONFIRM_PAYMENT_CONCURRENCY, async (reg) => {
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
      const amount = reg.is_member ? session.member_price : session.guest_price
      // Connect 手数料（チームが Connect 設定済みの場合のみ計算）
      const connectFees = hasConnect && connectTeam?.stripe_account_id
        ? calculateFees(amount, feePercent)
        : null
      // Step 1: PI作成（confirm前）— 課金はまだ発生しない
      const pi = await stripe.paymentIntents.create({
        amount,
        currency: "jpy",
        customer: swimmer.stripe_customer_id,
        payment_method: swimmer.stripe_payment_method_id,
        off_session: true,
        metadata: { session_id: sessionId, registration_id: reg.id, swimmer_id: reg.swimmer_id },
        ...(connectFees && connectTeam?.stripe_account_id ? {
          application_fee_amount: connectFees.platformFee,
          transfer_data: { destination: connectTeam.stripe_account_id },
        } : {}),
      }).catch(() => null)
      if (!pi) {
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "failed" })
          .eq("id", reg.id)
        await notifyUser(reg.swimmer_id, {
          type: "payment_failed",
          title: `「${session.title}」の参加費決済に失敗しました`,
          body: "決済処理中にエラーが発生しました。カード情報をご確認ください",
          team_id: session.team_id,
          link: "/payments",
        })
        paymentErrors.push(`${reg.id}: stripe payment intent creation failed`)
        return
      }

      // Step 2: PI idをDBに保存（confirmより先）— webhookが後から拾える状態にする
      const { error: piSaveErr } = await confirmAdmin
        .from("session_registrations")
        .update({ stripe_payment_intent_id: pi.id })
        .eq("id", reg.id)
      if (piSaveErr) {
        // DB保存失敗 → 未請求PIを取り消してスキップ（ユーザーへの課金なし）
        await stripe.paymentIntents.cancel(pi.id).catch(() => null)
        paymentErrors.push(`${reg.id}: failed to save payment intent id`)
        return
      }

      // Connect 送金記録は confirm より先に pending で作成しておく。
      // webhook の payment_intent.succeeded がこの後の confirm() より先に届いても
      // 更新対象の行が既に存在するため、条件付きUPDATEがサイレントに0件ヒットしない。
      if (connectFees && connectTeam?.stripe_account_id) {
        const { error: trErr } = await confirmAdmin.from("transfer_records").insert({
          team_id: session.team_id,
          session_id: sessionId,
          registration_id: reg.id,
          stripe_payment_intent_id: pi.id,
          amount,
          platform_fee: connectFees.platformFee,
          net_amount: connectFees.netAmount,
          status: "pending",
        })
        if (trErr) {
          console.error(`[confirmSession] transfer_records insert failed for PI ${pi.id}:`, trErr)
        }
      }

      // Step 3: 確定（ここで実際に課金）— 失敗してもwebhookがDBを更新できる
      try {
        await stripe.paymentIntents.confirm(pi.id, { off_session: true })
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "paid" })
          .eq("id", reg.id)
        // 参加費決済通知（本人へ）
        await notifyUser(reg.swimmer_id, {
          type: "payment_charged",
          title: `「${session.title}」の参加費が決済されました`,
          body: `¥${amount.toLocaleString()}が引き落とされました`,
          team_id: session.team_id,
          link: "/payments",
        })
      } catch (err) {
        console.error(`[confirmSession] Stripe confirm failed for ${reg.id}:`, err)
        await confirmAdmin
          .from("session_registrations")
          .update({ payment_status: "failed" })
          .eq("id", reg.id)
        await confirmAdmin
          .from("transfer_records")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", pi.id)
          .eq("status", "pending")
        await notifyUser(reg.swimmer_id, {
          type: "payment_failed",
          title: `「${session.title}」の参加費決済に失敗しました`,
          body: "お支払いカードへの請求に失敗しました。カード情報をご確認ください",
          team_id: session.team_id,
          link: "/payments",
        })
        paymentErrors.push(`${reg.id}: stripe confirm failed`)
      }
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
        if (updatedMember && updatedMember.stamp_remaining <= 2) {
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
  })

  // セッションステータスは決済処理の前に既に "confirmed" へ原子的に更新済み
  // （決済失敗があっても確定済みのまま残し、リトライ可能にする）

  // 参加登録済みメンバーへ開催確定通知
  const confirmedNotifAdmin = createAdminClient()
  const { data: confirmedRegistrants } = await confirmedNotifAdmin
    .from("session_registrations")
    .select("swimmer_id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .neq("swimmer_id", user.id)
  if (confirmedRegistrants && confirmedRegistrants.length > 0) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
    await notifyUsers(confirmedRegistrants.map((r) => r.swimmer_id), {
      type: "session_confirmed",
      title: `「${session.title}」が開催確定しました`,
      body: `${scheduledDate}のセッションが開催確定です。忘れずにご参加ください`,
      team_id: session.team_id,
      link: `/teams/${session.team_id}/sessions/${sessionId}`,
    })
  }

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

  const { data: session } = await createAdminClient()
    .from("practice_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }
  if (session.session_status === "cancelled") return { error: "既に中止済みのセッションです" }

  // admin権限チェック
  if (!(await isTeamAdmin(createAdminClient(), session.team_id, user.id))) return { error: "権限がありません" }

  // 確定後の中止の場合、返金・ポイント戻し
  if (session.session_status === "confirmed") {
    const cancelAdmin = createAdminClient()
    const { data: registrations } = await cancelAdmin
      .from("session_registrations")
      .select("*")
      .eq("session_id", sessionId)
      .eq("payment_status", "paid")

    if (registrations) {
      const refundErrors: string[] = []
      for (const reg of registrations) {
        if (reg.payment_method === "stripe" && reg.stripe_payment_intent_id) {
          if (!process.env.STRIPE_SECRET_KEY) {
            refundErrors.push(`${reg.id}: stripe not configured, refund skipped`)
            continue
          }
          try {
            await stripe.refunds.create({ payment_intent: reg.stripe_payment_intent_id })
          } catch (err) {
            const stripeErr = err as { code?: string }
            if (stripeErr.code === "charge_already_refunded") {
              // 前回の返金はStripeで成功していたがDB更新が失敗していたケース → DB更新に進む
              console.warn(`[cancelSession] Refund already processed for ${reg.id}, syncing DB status`)
            } else {
              console.error(`[cancelSession] Stripe refund failed for ${reg.id}:`, err)
              refundErrors.push(`${reg.id}: stripe refund failed`)
              continue
            }
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
            continue
          }
          const { error: refErr } = await cancelAdmin
            .from("session_registrations")
            .update({ payment_status: "refunded" })
            .eq("id", reg.id)
          if (refErr) refundErrors.push(`${reg.id}: point_card refund status update failed`)
        }
      }
      if (refundErrors.length > 0) {
        return { error: `返金処理中にエラーが発生しました（${refundErrors.length}件）` }
      }
    }
  }

  // セッションステータスを cancelled に（adminClientでRLSをバイパス）
  const { error: cancelErr } = await createAdminClient()
    .from("practice_sessions")
    .update({ session_status: "cancelled" })
    .eq("id", sessionId)

  if (cancelErr) return { error: "セッションの中止に失敗しました" }

  // 参加登録済みメンバーへ個別中止通知
  const notifAdmin = createAdminClient()
  const { data: registrants } = await notifAdmin
    .from("session_registrations")
    .select("swimmer_id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .neq("swimmer_id", user.id)  // 中止操作者（管理者）自身は除外
  if (registrants && registrants.length > 0) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
    await notifyUsers(registrants.map((r) => r.swimmer_id), {
      type: "session_cancelled",
      title: `「${session.title}」が中止になりました`,
      body: `${scheduledDate}に予定していたセッションが中止になりました`,
      team_id: session.team_id,
      link: `/teams/${session.team_id}/sessions/${sessionId}`,
    })
  }

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { success: true }
}

export async function getTeamSessions(teamId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("practice_sessions")
    .select("*")
    .eq("team_id", teamId)
    .order("scheduled_at", { ascending: true })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function getPublicSessions(filters?: {
  tags?: string[]
  q?: string
  location?: string
  from?: string
  to?: string
  type?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from("practice_sessions")
    .select("*, team:teams(id, name, avatar_url)")
    .eq("is_external", true)
    .eq("status", "published")
    .eq("session_status", "open")
    .order("scheduled_at", { ascending: true })

  if (filters?.from) {
    query = query.gte("scheduled_at", filters.from)
  }
  if (filters?.to) {
    query = query.lte("scheduled_at", filters.to)
  }
  if (filters?.q) {
    query = query.ilike("title", `%${filters.q}%`)
  }
  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`)
  }

  if (filters?.type) {
    query = query.eq("type", filters.type)
  }

  const { data, error } = await query
  if (error) return { data: [] }

  // タグフィルタ（アプリ層）
  let filtered = data || []
  if (filters?.tags && filters.tags.length > 0) {
    filtered = filtered.filter((s) => {
      const sessionTags: string[] = (s.target_tags as string[]) || []
      if (sessionTags.length === 0) return true
      return filters.tags!.some((t) => sessionTags.includes(t))
    })
  }

  return { data: filtered }
}

export async function getSession(sessionId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("practice_sessions")
    .select("*, team:teams(*)")
    .eq("id", sessionId)
    .single()

  if (error || !data) return { error: "セッションが見つかりません" }
  return { data }
}

export async function registerForSession(
  sessionId: string,
  paymentMethod: PaymentMethod,
  competitionEntry?: Record<string, unknown>
) {
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

  // 定員チェック（user clientはRLSで自分の登録しか見えないのでadminClientで全件取得）
  if (session.max_participants) {
    const { count } = await adminClient
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", sessionId)
      .is("cancelled_at", null)

    if (count !== null && count >= session.max_participants) {
      return { error: "定員に達しています" }
    }
  }

  // ポイントカード残数チェック（免除の場合は effectivePaymentMethod = "cash" なのでスキップされる）
  if (effectivePaymentMethod === "point_card") {
    if (!membership || membership.membership_type !== "point_card") {
      return { error: "ポイントカード会員ではありません" }
    }
    if (!session.allow_point_card) {
      return { error: "このセッションではポイントカードを利用できません" }
    }
    if (membership.stamp_remaining <= 0) {
      return { error: "ポイントカードの残回数が0です。追加購入してください。" }
    }
  }

  // キャンセル済みの既存レコードを確認（再登録ケース）
  const { data: cancelledReg } = await adminClient
    .from("session_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("swimmer_id", user.id)
    .not("cancelled_at", "is", null)
    .maybeSingle()

  if (cancelledReg) {
    // 既存レコードを再利用（cancelled_at をリセット）
    // 支払い方法が変わる場合もあるので stripe_payment_intent_id もクリア
    const { error } = await adminClient
      .from("session_registrations")
      .update({
        cancelled_at: null,
        payment_method: effectivePaymentMethod,
        payment_status: isExempt ? "free" : "pending",
        stripe_payment_intent_id: null,
        is_member: isMember,
        competition_entry: competitionEntry || null,
      })
      .eq("id", cancelledReg.id)

    if (error) return { error: "参加登録に失敗しました" }
  } else {
    // 新規登録（adminClientでRLSをバイパス）
    const { error } = await adminClient.from("session_registrations").insert({
      session_id: sessionId,
      swimmer_id: user.id,
      is_member: isMember,
      payment_method: effectivePaymentMethod,
      payment_status: isExempt ? "free" : "pending",
      competition_entry: competitionEntry || null,
    })

    if (error) {
      if (error.code === "23505") return { error: "既に参加登録済みです" }
      return { error: "参加登録に失敗しました" }
    }
  }

  // 最小開催人数達成チェック → 管理者へ通知
  if (session.min_participants) {
    const { count: currentCount } = await adminClient
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", sessionId)
      .is("cancelled_at", null)
    if (currentCount !== null && currentCount === session.min_participants) {
      const { data: minAdmins } = await adminClient
        .from("team_members")
        .select("swimmer_id")
        .eq("team_id", session.team_id)
        .eq("role", "admin")
        .eq("status", "active")
      if (minAdmins && minAdmins.length > 0) {
        await notifyUsers(minAdmins.map((a) => a.swimmer_id), {
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
  const { data: teamAdmins } = await adminClient
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", session.team_id)
    .eq("role", "admin")
    .eq("status", "active")
    .neq("swimmer_id", user.id)  // 自分自身には送らない
  if (teamAdmins && teamAdmins.length > 0) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
    await notifyUsers(teamAdmins.map((a) => a.swimmer_id), {
      type: "session_registered",
      title: `${registrantProfile?.name ?? "メンバー"}さんが参加登録しました`,
      body: `「${session.title}」${scheduledDate}`,
      team_id: session.team_id,
      link: `/sessions/${sessionId}`,
    })
  }

  // 参加者本人への登録確認通知（管理者は自分のチームなので省略）
  if (!isAdmin) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
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
        try {
          await stripe.refunds.create({ payment_intent: registration.stripe_payment_intent_id })
          newPaymentStatus = "refunded"
        } catch (err) {
          console.error(`[cancelRegistration] Stripe refund failed for ${registration.id}:`, err)
          return { error: "返金処理に失敗しました。管理者にお問い合わせください" }
        }
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
  const cancelUpdate: Record<string, unknown> = { cancelled_at: new Date().toISOString() }
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
  const { data: cancelAdmins } = await adminClient
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", session.team_id)
    .eq("role", "admin")
    .eq("status", "active")
    .neq("swimmer_id", user.id)  // 自分自身には送らない
  if (cancelAdmins && cancelAdmins.length > 0) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
    await notifyUsers(cancelAdmins.map((a) => a.swimmer_id), {
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

  const retryFetch = createAdminClient()
  const { data: registration } = await retryFetch
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
  if (!(await isTeamAdmin(createAdminClient(), session.team_id, user.id))) return { error: "権限がありません" }

  if (registration.payment_method === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "Stripe未設定環境では再決済できません" }
    }
    const retryAdmin = createAdminClient()
    const { data: swimmer } = await retryAdmin
      .from("profiles")
      .select("stripe_customer_id, stripe_payment_method_id")
      .eq("id", registration.swimmer_id)
      .single()
    if (!swimmer?.stripe_customer_id || !swimmer?.stripe_payment_method_id) {
      return { error: "カード情報が登録されていません" }
    }
    const retrySession = registration.session as { member_price: number; guest_price: number; team_id: string; session_status: string }
    const amount = registration.is_member ? retrySession.member_price : retrySession.guest_price

    // Connect 設定を確認（再決済時も同様に送金）
    const { data: retryTeam } = await retryAdmin
      .from("teams")
      .select("stripe_account_id, stripe_onboarding_completed")
      .eq("id", retrySession.team_id)
      .single()
    const retryHasConnect = !!(retryTeam?.stripe_account_id && retryTeam?.stripe_onboarding_completed)
    const retryFeePercent = retryHasConnect ? await getPlatformFeePercent() : 0
    const retryConnectFees = retryHasConnect && retryTeam?.stripe_account_id
      ? calculateFees(amount, retryFeePercent)
      : null

    // Step 1: PI作成（confirm前）
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: "jpy",
      customer: swimmer.stripe_customer_id,
      payment_method: swimmer.stripe_payment_method_id,
      off_session: true,
      metadata: {
        session_id: registration.session_id,
        registration_id: registrationId,
        swimmer_id: registration.swimmer_id,
      },
      ...(retryConnectFees && retryTeam?.stripe_account_id ? {
        application_fee_amount: retryConnectFees.platformFee,
        transfer_data: { destination: retryTeam.stripe_account_id },
      } : {}),
    }).catch(() => null)
    if (!pi) return { error: "再決済の準備に失敗しました" }

    // Step 2: PI idをDBに保存し payment_status を "pending" に戻す（confirmより先）
    // payment_status を "pending" に戻すことで、Step3後のDB更新失敗時に
    // webhookが .eq("payment_status","pending") フィルタで確実にレコードを拾える
    const { error: piSaveErr } = await retryAdmin
      .from("session_registrations")
      .update({ stripe_payment_intent_id: pi.id, payment_status: "pending" })
      .eq("id", registrationId)
    if (piSaveErr) {
      await stripe.paymentIntents.cancel(pi.id).catch(() => null)
      return { error: "再決済の準備中にエラーが発生しました" }
    }

    // Connect 送金記録は confirm より先に pending で作成しておく。
    // webhook の payment_intent.succeeded が confirm() より先に届いても
    // 更新対象の行が既に存在するため、条件付きUPDATEがサイレントに0件ヒットしない。
    if (retryConnectFees && retryTeam?.stripe_account_id) {
      const { error: trErr } = await retryAdmin.from("transfer_records").insert({
        team_id: retrySession.team_id,
        session_id: registration.session_id,
        registration_id: registrationId,
        stripe_payment_intent_id: pi.id,
        amount,
        platform_fee: retryConnectFees.platformFee,
        net_amount: retryConnectFees.netAmount,
        status: "pending",
      })
      if (trErr) {
        console.error(`[retryPayment] transfer_records insert failed for PI ${pi.id}:`, trErr)
      }
    }

    // Step 3: 確定（ここで実際に課金）
    try {
      await stripe.paymentIntents.confirm(pi.id, { off_session: true })
      await retryAdmin
        .from("session_registrations")
        .update({ payment_status: "paid" })
        .eq("id", registrationId)
      // 再決済成功通知（本人へ）
      const retrySessionTyped = registration.session as { title: string; team_id: string }
      await notifyUser(registration.swimmer_id, {
        type: "payment_charged",
        title: `「${retrySessionTyped.title}」の参加費が決済されました`,
        body: `¥${amount.toLocaleString()}が引き落とされました`,
        team_id: retrySessionTyped.team_id,
        link: "/payments",
      })
    } catch (err) {
      console.error(`[retryPayment] Stripe confirm failed for ${registrationId}:`, err)
      await retryAdmin
        .from("session_registrations")
        .update({ payment_status: "failed" })
        .eq("id", registrationId)
      await retryAdmin
        .from("transfer_records")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id)
        .eq("status", "pending")
      return { error: "再決済に失敗しました" }
    }
  }

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { success: true }
}

export async function exportSessionRegistrations(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const exportAdmin = createAdminClient()
  const { data: session } = await exportAdmin
    .from("practice_sessions")
    .select("team_id, title, type, competition_fields")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }

  // admin権限チェック
  if (!(await isTeamAdmin(exportAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  // adminClientで全参加者を取得（user clientはRLSで自分の登録しか見えない）
  const { data: registrations } = await exportAdmin
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .order("registered_at", { ascending: true })

  if (!registrations) return { error: "参加者情報の取得に失敗しました" }

  const fields: CompetitionField[] = (session.competition_fields as CompetitionField[]) || []

  // CSV生成
  const headers = ["名前", "メンバー/ゲスト", "支払方法", "支払状態"]
  fields.forEach((f) => headers.push(f.label))

  const rows = registrations.map((reg) => {
    const swimmer = reg.swimmer as Record<string, unknown> | null
    const entry = (reg.competition_entry || {}) as Record<string, unknown>
    const row = [
      (swimmer?.name as string) || "不明",
      reg.is_member ? "メンバー" : "ゲスト",
      reg.payment_method === "stripe" ? "カード" : reg.payment_method === "point_card" ? "回数券" : "現金",
      reg.payment_status,
    ]
    fields.forEach((f) => row.push(String(entry[f.key] || "")))
    return row
  })

  // セル先頭が =+-@ の場合、Excel等が数式として解釈しうる（CSVインジェクション対策）
  const sanitizeCsvCell = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value)

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${sanitizeCsvCell(String(cell)).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  // BOM付きUTF-8 CSV
  const bom = "\uFEFF"
  return { data: bom + csvContent, filename: `${session.title}_参加者.csv` }
}

export async function recordPriceView(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase.from("price_views").insert({
    session_id: sessionId,
    viewer_id: user.id,
  })

  return { success: true }
}

export async function getPriceViewers(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  const priceAdmin = createAdminClient()

  // admin権限チェック（adminClientでRLS自己参照をバイパス）
  const { data: session } = await priceAdmin
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) return { data: [] }

  if (!(await isTeamAdmin(priceAdmin, session.team_id, user.id))) return { error: "権限がありません", data: [] }

  const { data, error } = await priceAdmin
    .from("price_views")
    .select("*, viewer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .order("viewed_at", { ascending: false })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function getSessionRegistrations(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], count: 0 }

  const regAdmin = createAdminClient()

  // セッションのグループIDを取得してadmin権限チェック（adminClientでRLSバイパス）
  const { data: session } = await regAdmin
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) return { data: [], count: 0 }

  if (!(await isTeamAdmin(regAdmin, session.team_id, user.id))) return { error: "権限がありません", data: [], count: 0 }

  // adminClientで全参加者を取得（user clientはRLSで自分の登録しか見えない）
  const { data, error } = await regAdmin
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .order("registered_at", { ascending: true })

  if (error) return { data: [], count: 0 }
  const activeCount = data?.filter((r) => !r.cancelled_at).length || 0
  return { data: data || [], count: activeCount }
}


// 現金払いを集金済みにマーク（管理者のみ）
export async function markCashPaid(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "認証が必要です" }

  const adminClient = createAdminClient()

  const { data: reg, error: regError } = await adminClient
    .from("session_registrations")
    .select("session_id, swimmer_id, payment_method, payment_status, is_member, session:practice_sessions!inner(team_id, title, member_price, guest_price)")
    .eq("id", registrationId)
    .single()

  if (regError || !reg) return { error: "参加登録が見つかりません" }
  if (reg.payment_method !== "cash") return { error: "現金払い以外は変更できません" }
  if (reg.payment_status === "paid") return { error: "すでに集金済みです" }
  if (reg.payment_status !== "pending") return { error: "未払いの登録のみ変更できます" }

  const session = reg.session as unknown as { team_id: string; title: string; member_price: number; guest_price: number }

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

  const chargedAmount = reg.is_member ? (session.member_price || 0) : (session.guest_price || 0)
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
