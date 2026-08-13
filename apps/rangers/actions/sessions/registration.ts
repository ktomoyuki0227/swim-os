"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { PaymentMethod } from "@/types/database"
import type { Database, Json } from "@/types/database-generated"
import { getActiveTeamAdminIds } from "@/lib/auth/require-team-admin"
import { formatSessionDateJa } from "@/lib/format-date"
import { notifyUser, notifyUsers } from "@/lib/notifications"
import { competitionEntrySchema } from "@/lib/validations"

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
    .select("id, role, membership_type, stamp_remaining, subscription_status")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  const isMember = !!membership

  // 管理者は自チームのセッションに無料で参加（ロールベースで判定）
  const isAdmin = membership?.role === "admin"

  // 月謝会員はStripe Subscriptionが未払い状態
  // (past_due/unpaid/canceled/incomplete_expired/incomplete)の間は
  // membership_typeが"monthly"のままでも免除対象から外す(支払い遅延中の無料参加を防ぐ)。
  // tryStartMonthlySubscription(lib/stripe-helpers.ts)はdefault_incompleteで作成するため、初回決済用のカードが
  // 登録されていない場合、確定(active)までの間は"incomplete"のままになる。これを
  // 免除対象外に含めないと、支払い方法未登録のまま一時的に月謝免除扱いになってしまう。
  // subscription_status が null(現金払い等、Subscription未作成)の場合は従来通り免除対象。
  const LAPSED_SUBSCRIPTION_STATUSES = ["past_due", "unpaid", "canceled", "incomplete_expired", "incomplete"]
  const hasLapsedSubscription =
    membership?.membership_type === "monthly" &&
    !!membership.subscription_status &&
    LAPSED_SUBSCRIPTION_STATUSES.includes(membership.subscription_status)

  // 年会費・月謝会員の参加費免除判定（サーバー側で完結 — クライアントは操作不可）
  const isExempt =
    isAdmin ||
    (!!(session.team as { fee_members_exempt_session?: boolean } | null)?.fee_members_exempt_session &&
    isMember &&
    (membership?.membership_type === "annual" || membership?.membership_type === "monthly") &&
    !hasLapsedSubscription)

  // 免除の場合は支払方法を cash に固定（クライアントが誤った値を送っても上書きする）
  const effectivePaymentMethod = isExempt ? "cash" : paymentMethod

  // 非外部セッションはグループメンバーのみ参加可
  if (!session.is_external && !isMember) {
    return { error: "このグループのメンバーではありません" }
  }

  // 対象性別チェック（gender_filterが'all'以外の場合、一致しないメンバーは参加不可）
  if (session.gender_filter && session.gender_filter !== "all") {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("gender")
      .eq("id", user.id)
      .single()
    if (profile?.gender !== session.gender_filter) {
      return { error: "対象外のため参加登録できません" }
    }
  }

  // 対象メンバーチェック（target_membersが指定されている場合、含まれないメンバーは参加不可）
  if (session.target_members && session.target_members.length > 0 && !session.target_members.includes(user.id)) {
    return { error: "対象外のため参加登録できません" }
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

  // closed/cancelled: 締切通過後は受付・キャンセルとも凍結し、開催者の確定/中止判断に委ねる
  // (cancelledは既にセッション自体が中止済みで、個別キャンセルの余地がない)。
  if (session.session_status === "closed" || session.session_status === "cancelled") {
    return { error: "申込み締切を過ぎているため、ご自身でのキャンセルはできません。やむを得ない事情がある場合は運営にお問い合わせください" }
  }

  // confirmed: 決済済み(paid)の場合のみキャンセル不可・返金なしとする。
  // pending/failed/free は実際に課金されていない(Stripe請求/回数券消費はconfirmSession実行時のみ発生)
  // ため、無条件にキャンセルを許可してよい。ここを一律ブロックにすると、決済失敗などで
  // 実質お金が動いていない登録者まで運営への個別問い合わせが必要になり、運営の負担が増えてしまう。
  if (session.session_status === "confirmed" && registration.payment_status === "paid") {
    return { error: "開催確定・決済が完了しているため、ご自身でのキャンセルはできません。やむを得ない事情がある場合は運営にお問い合わせください" }
  }

  const cancelUpdate: Database["public"]["Tables"]["session_registrations"]["Update"] = { cancelled_at: new Date().toISOString() }

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

        // role(=リンク先)ごとに2グループへまとめ、一括INSERTを2回だけ発行する。
        // 以前はメンバー数分 await notifyUser() を直列実行しており、大人数チームで
        // サーバーレス関数のタイムアウトに達するリスクがあった。
        const adminIds = notifyTargets.filter((m) => m.role === "admin").map((m) => m.swimmer_id)
        const memberIds = notifyTargets.filter((m) => m.role !== "admin").map((m) => m.swimmer_id)

        await Promise.all([
          notifyUsers(adminIds, {
            type: "waitlist_available",
            title: `空きが出ました: ${session.title}`,
            body: `「${session.title}」に空きが出ました。参加登録が可能です。`,
            team_id: session.team_id,
            link: `/sessions/${sessionId}`,
          }),
          notifyUsers(memberIds, {
            type: "waitlist_available",
            title: `空きが出ました: ${session.title}`,
            body: `「${session.title}」に空きが出ました。参加登録が可能です。`,
            team_id: session.team_id,
            link: `/teams/${session.team_id}/sessions/${sessionId}`,
          }),
        ])
      }
    }
  }

  revalidatePath("/teams")
  revalidatePath("/notifications")
  return { success: true }
}
