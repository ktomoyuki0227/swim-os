"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sessionSchema, sessionUpdateSchema } from "@/lib/validations"
import { isTeamAdmin, isTeamMember } from "@/lib/auth/require-team-admin"
import { formatSessionDateJa, toJstIso, toJstEndOfDayIso } from "@/lib/format-date"
import { notifyUsers } from "@/lib/notifications"

export async function createSession(teamId: string, data: unknown) {
  const parsed = sessionSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（adminClientでRLSをバイパス）
  const adminClient = createAdminClient()
  if (!(await isTeamAdmin(adminClient, teamId, user.id))) return { error: "権限がありません" }

  const scheduledAtIso = toJstIso(parsed.data.scheduled_at)
  const registrationDeadlineIso = parsed.data.registration_deadline
    ? toJstEndOfDayIso(parsed.data.registration_deadline)
    : null

  // クライアント側のstep-detailsでも同様のチェックがあるが、date-only文字列と
  // datetime-local文字列を素朴に比較するとタイムゾーン解釈がずれて回避できてしまうため、
  // 両方をJST変換後のISO文字列にしてからサーバー側でも検証する
  if (registrationDeadlineIso && new Date(registrationDeadlineIso) >= new Date(scheduledAtIso)) {
    return { error: "申込締切は開始日時より前に設定してください" }
  }

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
      scheduled_at: scheduledAtIso,
      end_at: parsed.data.end_at ? toJstIso(parsed.data.end_at) : null,
      location: parsed.data.location,
      meeting_point: parsed.data.meeting_point || null,
      gender_filter: parsed.data.gender_filter || "all",
      member_price: parsed.data.member_price,
      guest_price: parsed.data.guest_price,
      registration_deadline: registrationDeadlineIso,
      min_participants: parsed.data.min_participants ?? null,
      max_participants: parsed.data.max_participants ?? null,
      course_rules: parsed.data.course_rules || null,
      target_tags: parsed.data.target_tags,
      target_members: parsed.data.target_members || null,
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
    const scheduledDate = formatSessionDateJa(session.scheduled_at)
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
    .select("team_id, session_status, title, scheduled_at, registration_deadline, location, member_price, guest_price")
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
    updateData.scheduled_at = toJstIso(updateData.scheduled_at)
  }
  if (updateData.end_at) {
    updateData.end_at = toJstIso(updateData.end_at)
  }
  if (updateData.registration_deadline) {
    updateData.registration_deadline = toJstEndOfDayIso(updateData.registration_deadline)
  }

  // クライアント側の検証だけだとdate-only/datetime-local文字列の解釈違いで
  // すり抜けうるため、JST変換後のISO文字列同士でサーバー側でも検証する。
  // 今回のリクエストで変更されていない側は現在DBの値（既にISO変換済み）を使う
  const effectiveScheduledAt = updateData.scheduled_at ?? session.scheduled_at
  const effectiveDeadline =
    updateData.registration_deadline !== undefined
      ? updateData.registration_deadline
      : session.registration_deadline
  if (effectiveDeadline && new Date(effectiveDeadline) >= new Date(effectiveScheduledAt)) {
    return { error: "申込締切は開始日時より前に設定してください" }
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
      toJstIso(parsed.data.scheduled_at) !== new Date(session.scheduled_at).toISOString()) ||
    (parsed.data.location && parsed.data.location !== session.location)

  // 参加費の変更は、開催確定(confirmSession)時点の料金に直結するため別枠で検知する。
  // 登録済み(pending)の参加者は「登録時に見た金額」と異なる金額を課金される可能性があるため、
  // 日時・場所等の変更とは別に必ず通知する。
  // confirmed済みセッションは上でprice変更自体がupdateDataから除外され実際には更新されないため、
  // その場合はparsed.data上の差分だけで誤って「変更された」通知を送らないようにする
  const hasPriceChange =
    session.session_status !== "confirmed" &&
    ((parsed.data.member_price !== undefined && parsed.data.member_price !== session.member_price) ||
      (parsed.data.guest_price !== undefined && parsed.data.guest_price !== session.guest_price))

  if (hasImportantChange || hasPriceChange) {
    const { data: registrants } = await updateAdmin
      .from("session_registrations")
      .select("swimmer_id")
      .eq("session_id", sessionId)
      .is("cancelled_at", null)
    if (registrants && registrants.length > 0) {
      const sessionTitle = parsed.data.title ?? session.title
      const body = hasPriceChange
        ? "参加費が変更されました。開催確定時にはこの新しい金額で決済されます。ご確認ください"
        : "日時・場所などの情報が更新されています。ご確認ください"
      await notifyUsers(registrants.map((r) => r.swimmer_id), {
        type: "session_updated",
        title: `「${sessionTitle}」の内容が変更されました`,
        body,
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

  const adminClient = createAdminClient()
  const { data: session } = await adminClient
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .single()
  if (!session) return { error: "セッションが見つかりません" }

  if (!(await isTeamAdmin(adminClient, session.team_id, user.id))) return { error: "権限がありません" }

  // 参加者がいるか確認。session_registrations は practice_sessions への
  // ON DELETE CASCADE のため、ここでブロックしないと決済履歴(charged_amount /
  // stripe_payment_intent_id等)がキャンセル済み登録ごと消え去ってしまう。
  // 現在参加中の登録に加え、キャンセル済みでも決済履歴が残る登録があれば削除を止める。
  const { data: registrations } = await adminClient
    .from("session_registrations")
    .select("id, cancelled_at, payment_status, charged_amount")
    .eq("session_id", sessionId)

  const blockingRegistrations = (registrations || []).filter(
    (r) => !r.cancelled_at || r.charged_amount != null || r.payment_status === "paid" || r.payment_status === "refunded"
  )

  if (blockingRegistrations.length > 0) {
    return { error: `${blockingRegistrations.length}名が参加登録済み、または決済履歴が残っています。先にセッションを中止してください。` }
  }

  const { error } = await adminClient
    .from("practice_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) return { error: "セッションの削除に失敗しました" }

  revalidatePath("/sessions")
  return { success: true }
}

export async function getTeamSessions(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  const admin = createAdminClient()
  if (!(await isTeamMember(admin, teamId, user.id))) return { data: [] }

  const { data, error } = await admin
    .from("practice_sessions")
    .select("*")
    .eq("team_id", teamId)
    .order("scheduled_at", { ascending: true })
    .limit(500) // 長期運用チームでの無制限クエリを防ぐ安全上限

  if (error) return { data: [] }
  return { data: data || [] }
}

/**
 * 複数チームのセッション一覧を1回のクエリでまとめて取得する（ダッシュボード等、
 * 複数チームを横断表示する画面向け）。getTeamSessionsをチーム数分ループ呼び出しすると
 * チームごとにメンバーシップ確認+セッション取得の2クエリが走るN+1になるため、
 * メンバーシップ確認・セッション取得それぞれを .in() で1回にまとめる。
 */
export async function getTeamSessionsForTeams(teamIds: string[]) {
  if (teamIds.length === 0) return { data: {} as Record<string, Record<string, unknown>[]> }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: {} as Record<string, Record<string, unknown>[]> }

  const admin = createAdminClient()

  // 呼び出し元が渡したteamIdsのうち、実際にアクティブなメンバーであるチームのみに絞り込む
  const { data: memberships } = await admin
    .from("team_members")
    .select("team_id")
    .in("team_id", teamIds)
    .eq("swimmer_id", user.id)
    .eq("status", "active")

  const memberTeamIds = (memberships || []).map((m) => m.team_id)
  if (memberTeamIds.length === 0) return { data: {} as Record<string, Record<string, unknown>[]> }

  const { data, error } = await admin
    .from("practice_sessions")
    .select("*")
    .in("team_id", memberTeamIds)
    .order("scheduled_at", { ascending: true })
    .limit(500 * memberTeamIds.length) // getTeamSessionsのチームあたり上限(500)と同等の総枠を確保

  if (error) return { data: {} as Record<string, Record<string, unknown>[]> }

  const grouped: Record<string, Record<string, unknown>[]> = {}
  for (const session of data || []) {
    const teamId = session.team_id as string
    if (!grouped[teamId]) grouped[teamId] = []
    grouped[teamId].push(session)
  }
  return { data: grouped }
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

  // 外部公開セッションはログイン済みなら誰でも閲覧できるため、
  // target_members / course_rules / competition_fields / coach_id / content 等の
  // 内部限定カラムを含めず、一覧表示に必要なカラムのみ返す。
  let query = supabase
    .from("practice_sessions")
    .select(
      "id, team_id, title, type, scheduled_at, location, guest_price, target_tags, session_status, status, is_external, team:teams(id, name, avatar_url)"
    )
    .eq("is_external", true)
    .eq("status", "published")
    .eq("session_status", "open")
    .order("scheduled_at", { ascending: true })
    .limit(300) // 掲載件数増加に伴う無制限クエリを防ぐ安全上限

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isMember = !!user && (await isTeamMember(admin, data.team_id, user.id))

  // 同じチームのアクティブなメンバーには全カラムを返す（管理画面での編集等に必要）
  if (isMember) return { data }

  // 非メンバー（未ログイン、または他チームの一般ユーザー）には
  // 外部公開セッションのみ、安全なカラムに絞って返す。
  // member_price/guest_price は「料金を確認する」操作(recordPriceView)経由でのみ
  // 取得させる（管理者への閲覧通知を確実にトリガーさせるため、ここには含めない）。
  // target_members(内部ユーザーID列挙)・course_rules・coach_id等の内部運用カラムも除外する。
  if (data.is_external && data.status === "published") {
    const rawTeam = data.team as Record<string, unknown> | null
    const publicTeam = rawTeam
      ? {
          id: rawTeam.id,
          name: rawTeam.name,
          description: rawTeam.description,
          avatar_url: rawTeam.avatar_url,
        }
      : null
    return {
      data: {
        id: data.id,
        team_id: data.team_id,
        title: data.title,
        description: data.description,
        content: data.content,
        type: data.type,
        scheduled_at: data.scheduled_at,
        end_at: data.end_at,
        location: data.location,
        gender_filter: data.gender_filter,
        session_status: data.session_status,
        status: data.status,
        is_external: data.is_external,
        registration_deadline: data.registration_deadline,
        min_participants: data.min_participants,
        max_participants: data.max_participants,
        allow_point_card: data.allow_point_card,
        target_tags: data.target_tags,
        competition_fields: data.competition_fields,
        team: publicTeam,
      },
    }
  }

  return { error: "セッションが見つかりません" }
}
