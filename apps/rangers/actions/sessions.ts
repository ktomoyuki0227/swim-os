"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sessionSchema, sessionUpdateSchema } from "@/lib/validations"
import type { PaymentMethod, CompetitionField } from "@/types/database"

export async function createSession(teamId: string, data: unknown) {
  const parsed = sessionSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（adminClientでRLSをバイパス）
  const adminClient = createAdminClient()
  const { data: adminMembership } = await adminClient
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

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
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      end_at: parsed.data.end_at ? new Date(parsed.data.end_at).toISOString() : null,
      location: parsed.data.location,
      meeting_point: parsed.data.meeting_point || null,
      gender_filter: parsed.data.gender_filter || "all",
      member_price: parsed.data.member_price,
      guest_price: parsed.data.guest_price,
      registration_deadline: parsed.data.registration_deadline
        ? new Date(parsed.data.registration_deadline).toISOString()
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

  // セッション作成のお知らせを自動生成
  await createSessionAnnouncement(teamId, session, "created")

  revalidatePath("/instructor/sessions")
  return { data: session }
}

export async function updateSession(sessionId: string, data: unknown) {
  const parsed = sessionUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .single()
  if (!session) return { error: "セッションが見つかりません" }

  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("practice_sessions")
    .update(parsed.data)
    .eq("id", sessionId)

  if (error) return { error: "セッションの更新に失敗しました" }

  revalidatePath("/instructor/sessions")
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

  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

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

  revalidatePath("/instructor/sessions")
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

  // admin権限チェック
  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  // 参加登録者を取得
  const { data: registrations } = await supabase
    .from("session_registrations")
    .select("*")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)

  if (!registrations) return { error: "参加者情報の取得に失敗しました" }

  // 決済処理（会員種別ごとに処理）
  const paymentErrors: string[] = []
  for (const reg of registrations) {
    if (reg.payment_method === "stripe") {
      // TODO: Stripe 一括課金（サンドボックス）
      // const paymentIntent = await stripe.paymentIntents.create(...)
      const { error: payErr } = await supabase
        .from("session_registrations")
        .update({ payment_status: "paid" })
        .eq("id", reg.id)
      if (payErr) paymentErrors.push(`${reg.id}: stripe update failed`)
    } else if (reg.payment_method === "point_card") {
      // ポイントカード消費
      const { error: rpcErr } = await supabase.rpc("decrement_stamp", {
        p_session_id: sessionId,
        p_swimmer_id: reg.swimmer_id,
      })
      if (rpcErr) {
        paymentErrors.push(`${reg.id}: stamp decrement failed`)
        continue
      }
      const { error: payErr } = await supabase
        .from("session_registrations")
        .update({ payment_status: "paid" })
        .eq("id", reg.id)
      if (payErr) paymentErrors.push(`${reg.id}: point_card status update failed`)
    }
    // cash はそのまま（当日回収）
  }

  if (paymentErrors.length > 0) {
    return { error: `決済処理中にエラーが発生しました（${paymentErrors.length}件）` }
  }

  // セッションステータスを confirmed に更新（adminClientでRLSをバイパス）
  const { error: confirmErr } = await createAdminClient()
    .from("practice_sessions")
    .update({ session_status: "confirmed" })
    .eq("id", sessionId)
  if (confirmErr) return { error: "セッション確定の更新に失敗しました" }

  // お知らせを配信
  await createSessionAnnouncement(session.team_id, session, "confirmed")

  revalidatePath("/instructor/sessions")
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

  // admin権限チェック
  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  // 確定後の中止の場合、返金・ポイント戻し
  if (session.session_status === "confirmed") {
    const { data: registrations } = await supabase
      .from("session_registrations")
      .select("*")
      .eq("session_id", sessionId)
      .eq("payment_status", "paid")

    if (registrations) {
      const refundErrors: string[] = []
      for (const reg of registrations) {
        if (reg.payment_method === "stripe" && reg.stripe_payment_intent_id) {
          // TODO: Stripe 返金処理
          // await stripe.refunds.create({ payment_intent: reg.stripe_payment_intent_id })
          const { error: refErr } = await supabase
            .from("session_registrations")
            .update({ payment_status: "refunded" })
            .eq("id", reg.id)
          if (refErr) refundErrors.push(`${reg.id}: stripe refund status update failed`)
        } else if (reg.payment_method === "point_card") {
          // ポイント戻し
          const { error: rpcErr } = await supabase.rpc("increment_stamp", {
            p_session_id: sessionId,
            p_swimmer_id: reg.swimmer_id,
          })
          if (rpcErr) {
            refundErrors.push(`${reg.id}: stamp increment failed`)
            continue
          }
          const { error: refErr } = await supabase
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

  // お知らせを配信
  await createSessionAnnouncement(session.team_id, session, "cancelled")

  revalidatePath("/instructor/sessions")
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
  location?: string
  from?: string
  to?: string
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
  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`)
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
  const { data: session } = await adminClient
    .from("practice_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }

  // メンバーシップ確認（adminClientでRLSをバイパス）
  const { data: membership } = await adminClient
    .from("team_members")
    .select("id, membership_type, stamp_remaining")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  const isMember = !!membership

  // 非外部セッションはチームメンバーのみ参加可
  if (!session.is_external && !isMember) {
    return { error: "このチームのメンバーではありません" }
  }

  // 締め切りチェック
  if (session.registration_deadline && new Date(session.registration_deadline) < new Date()) {
    return { error: "参加登録の締め切りを過ぎています" }
  }

  // 定員チェック
  if (session.max_participants) {
    const { count } = await supabase
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", sessionId)
      .is("cancelled_at", null)

    if (count !== null && count >= session.max_participants) {
      return { error: "定員に達しています" }
    }
  }

  // ポイントカード残数チェック
  if (paymentMethod === "point_card") {
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

  // 参加登録（この時点では決済しない）
  const { error } = await supabase.from("session_registrations").insert({
    session_id: sessionId,
    swimmer_id: user.id,
    is_member: isMember,
    payment_method: paymentMethod,
    payment_status: "pending",
    competition_entry: competitionEntry || null,
  })

  if (error) {
    if (error.code === "23505") return { error: "既に参加登録済みです" }
    return { error: "参加登録に失敗しました" }
  }

  revalidatePath(`/teams`)
  return { success: true }
}

export async function cancelRegistration(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: registration } = await supabase
    .from("session_registrations")
    .select("*, session:practice_sessions(*)")
    .eq("session_id", sessionId)
    .eq("swimmer_id", user.id)
    .is("cancelled_at", null)
    .single()

  if (!registration) return { error: "参加登録が見つかりません" }

  const session = registration.session

  // 開催確定後のキャンセル
  if (session.session_status === "confirmed" && registration.payment_status === "paid") {
    if (registration.payment_method === "stripe") {
      // TODO: キャンセルルールに基づく返金
      // Stripe 返金処理
    } else if (registration.payment_method === "point_card") {
      // ポイント戻し（アトミックなSQL式で競合を防ぐ）
      await supabase.rpc("increment_stamp", {
        p_session_id: sessionId,
        p_swimmer_id: user.id,
      })
    }
  }

  // キャンセル記録
  await supabase
    .from("session_registrations")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", registration.id)

  // 定員キャンセル待ち通知: 定員ありセッションで空きが出た場合
  if (session.max_participants) {
    const { count } = await supabase
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", sessionId)
      .is("cancelled_at", null)

    if (count !== null && count < session.max_participants) {
      // セッションの通知対象メンバーに空き通知を配信
      const { data: targetMembers } = await supabase
        .from("team_members")
        .select("swimmer_id")
        .eq("team_id", session.team_id)
        .eq("status", "active")

      if (targetMembers) {
        // 既に登録済みのユーザーは除外
        const { data: existingRegs } = await supabase
          .from("session_registrations")
          .select("swimmer_id")
          .eq("session_id", sessionId)
          .is("cancelled_at", null)

        const registeredIds = new Set(existingRegs?.map((r) => r.swimmer_id) || [])
        const notifyTargets = targetMembers.filter((m) => !registeredIds.has(m.swimmer_id))

        const adminClient = createAdminClient()
        for (const target of notifyTargets) {
          await adminClient.from("notifications").insert({
            user_id: target.swimmer_id,
            type: "waitlist_available",
            title: `空きが出ました: ${session.title}`,
            body: `「${session.title}」に空きが出ました。参加登録が可能です。`,
            link: `/teams/${session.team_id}/sessions/${sessionId}`,
          })
        }
      }
    }
  }

  revalidatePath("/teams")
  return { success: true }
}

export async function retryPayment(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: registration } = await supabase
    .from("session_registrations")
    .select("*, session:practice_sessions(*)")
    .eq("id", registrationId)
    .single()

  if (!registration) return { error: "登録情報が見つかりません" }
  if (registration.payment_status !== "failed") return { error: "決済失敗のステータスではありません" }

  // admin権限チェック
  const session = registration.session as { team_id: string }
  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  if (registration.payment_method === "stripe") {
    // TODO: Stripe 再決済
    // const paymentIntent = await stripe.paymentIntents.create(...)
    await supabase
      .from("session_registrations")
      .update({ payment_status: "paid" })
      .eq("id", registrationId)
  }

  revalidatePath("/instructor/sessions")
  return { success: true }
}

export async function exportSessionRegistrations(
  sessionId: string,
  format: "csv" | "excel"
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("team_id, title, type, competition_fields")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }

  // admin権限チェック
  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { data: registrations } = await supabase
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

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
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
  if (!user) redirect("/login")

  // admin権限チェック
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .single()
  if (!session) return { data: [] }

  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません", data: [] }

  const { data, error } = await supabase
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

  // セッションのチームIDを取得してadmin権限チェック
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .single()
  if (!session) return { data: [], count: 0 }

  const { data: adminMembership } = await createAdminClient()
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません", data: [], count: 0 }

  const { data, error } = await supabase
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .order("registered_at", { ascending: true })

  if (error) return { data: [], count: 0 }
  const activeCount = data?.filter((r) => !r.cancelled_at).length || 0
  return { data: data || [], count: activeCount }
}

// お知らせ自動生成ヘルパー
async function createSessionAnnouncement(
  teamId: string,
  session: { id: string; title: string; scheduled_at: string },
  action: "created" | "confirmed" | "cancelled"
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const titles: Record<string, string> = {
    created: `新しいセッション: ${session.title}`,
    confirmed: `開催確定: ${session.title}`,
    cancelled: `中止のお知らせ: ${session.title}`,
  }

  const date = new Date(session.scheduled_at).toLocaleDateString("ja-JP")
  const bodies: Record<string, string> = {
    created: `${date} に「${session.title}」が追加されました。参加登録をお願いします。`,
    confirmed: `${date} の「${session.title}」が開催確定しました。`,
    cancelled: `${date} の「${session.title}」は中止となりました。`,
  }

  await supabase.from("announcements").insert({
    team_id: teamId,
    author_id: user.id,
    title: titles[action],
    body: bodies[action],
    link_url: `/teams/${teamId}/sessions/${session.id}`,
  })
}
