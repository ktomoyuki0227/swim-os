import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RegisterButton } from "./register-button"
import { CancelButton } from "./cancel-button"
import { PriceReveal } from "./price-reveal"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "試合",
  event: "イベント",
  meeting: "ミーティング",
}

const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  paid: "支払済み",
  pending: "確定待ち",
  failed: "決済失敗",
  unpaid: "未払い",
  refunded: "返金済",
  free: "免除",
}

const PARTICIPANT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-[#eaf7f0] text-[#0f8a4f]",
  pending: "bg-[#edf0f4] text-[#475569]",
  failed: "bg-[#fdecea] text-[#c0392b]",
  unpaid: "bg-[#fdf6e3] text-[#b8860b]",
  refunded: "bg-[#edf0f4] text-[#475569]",
  free: "bg-[#e8f2f8] text-[#005F8C]",
}

const PARTICIPANT_METHOD_LABELS: Record<string, string> = {
  cash: "現金",
  point_card: "回数券",
  card: "カード",
}

interface SessionPageProps {
  params: Promise<{ id: string; sid: string }>
}

export default async function MemberSessionPage({ params }: SessionPageProps) {
  const { id: teamId, sid: sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sessionResult = await getSession(sessionId)
  if (sessionResult.error || !sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data

  // メンバーか確認 & カード登録状況を取得
  let isMember = false
  let isAdmin = false
  let membershipType: string | null = null
  let hasCard = false
  if (user) {
    const [{ data: membership }, { data: profileData }] = await Promise.all([
      supabase
        .from("team_members")
        .select("id, membership_type, role")
        .eq("team_id", session.team_id)
        .eq("swimmer_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("stripe_payment_method_id")
        .eq("id", user.id)
        .maybeSingle(),
    ])
    isMember = !!membership
    isAdmin = membership?.role === "admin"
    membershipType = membership?.membership_type ?? null
    hasCard = !!profileData?.stripe_payment_method_id
  }

  // 管理者向け: 参加者ごとの支払いステータス一覧
  // registrations_select_admin ポリシーにより通常クライアントで取得可能
  type ParticipantRow = {
    id: string
    payment_status: string
    payment_method: string | null
    is_member: boolean
    swimmer: { id: string; name: string } | null
  }
  let participants: ParticipantRow[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from("session_registrations")
      .select("id, payment_status, payment_method, is_member, swimmer:profiles(id, name)")
      .eq("session_id", sessionId)
      .is("cancelled_at", null)
      .order("registered_at", { ascending: true })

    participants = (data ?? []).map((r) => ({
      id: r.id,
      payment_status: r.payment_status,
      payment_method: r.payment_method,
      is_member: r.is_member,
      swimmer: Array.isArray(r.swimmer) ? (r.swimmer[0] ?? null) : r.swimmer,
    }))
  }

  const teamInfo = session.team as { fee_members_exempt_session?: boolean } | null
  const isExempt =
    !!teamInfo?.fee_members_exempt_session &&
    isMember &&
    (membershipType === "annual" || membershipType === "monthly")

  // 自分の登録状況を確認
  let myRegistration: Record<string, unknown> | null = null
  if (user) {
    const { data: reg } = await supabase
      .from("session_registrations")
      .select("*")
      .eq("session_id", sessionId)
      .eq("swimmer_id", user.id)
      .is("cancelled_at", null)
      .maybeSingle()
    myRegistration = reg
  }

  // 参加者数を取得（人数のみ表示）
  const { count: registrationCount } = await supabase
    .from("session_registrations")
    .select("id", { count: "exact" })
    .eq("session_id", sessionId)
    .is("cancelled_at", null)

  const scheduledDate = new Date(session.scheduled_at)
  const isPast = scheduledDate < new Date()
  const isDeadlinePassed =
    session.registration_deadline && new Date(session.registration_deadline) < new Date()
  const isFull =
    session.max_participants !== null &&
    registrationCount !== null &&
    registrationCount >= session.max_participants

  const canRegister =
    !isPast &&
    !isDeadlinePassed &&
    !isFull &&
    session.session_status !== "cancelled" &&
    !myRegistration

  // キャンセル可能か判定（開催後はロック）
  const canCancel = myRegistration && !isPast

  const isCompetition = session.type === "competition"
  const competitionFields = (session.competition_fields || []) as { key: string; label: string; type: string; required: boolean; options?: string[] }[]

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "受付中", className: "bg-[#e8f2f8] text-[#005F8C] border-transparent" },
    confirmed: { label: "開催確定", className: "bg-[#eaf7f0] text-[#0f8a4f] border-transparent" },
    cancelled: { label: "中止", className: "bg-[#fdecea] text-[#c0392b] border-transparent" },
  }
  const status = statusConfig[session.session_status] ?? statusConfig.open

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teams/${teamId}`} className="text-sm text-[#475569] hover:text-[#1a2332]">
          ← グループに戻る
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1a2332]">{session.title}</h1>
            <p className="text-xs text-[#475569]">{SESSION_TYPE_LABELS[session.type]}</p>
          </div>
          <Badge className={status.className}>
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Session details */}
      <Card className="border-[#dce3ea]">
        <CardContent className="divide-y divide-[#dce3ea] p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#475569]">日時</span>
            <span className="text-sm font-medium text-[#1a2332]">
              {scheduledDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                timeZone: "Asia/Tokyo",
              })}
              {" "}
              {scheduledDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#475569]">場所</span>
            <span className="text-sm font-medium text-[#1a2332]">{session.location || "未定"}</span>
          </div>

          {/* 料金表示: メンバーには直接表示、非メンバーには閲覧追跡付き */}
          {isMember && "member_price" in session ? (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#475569]">参加費（メンバー）</span>
              <span className="text-sm font-bold text-[#005F8C]">
                {isExempt ? "無料（会費会員）" : `¥${(session.member_price || 0).toLocaleString()}`}
              </span>
            </div>
          ) : (
            <PriceReveal sessionId={sessionId} />
          )}

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#475569]">参加者数</span>
            <span className="text-sm font-medium text-[#1a2332]">
              {registrationCount}名
              {session.max_participants && ` / ${session.max_participants}名`}
            </span>
          </div>
          {session.registration_deadline && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#475569]">申込締切</span>
              <span className={`text-sm font-medium ${isDeadlinePassed ? "text-[#c0392b]" : "text-[#1a2332]"}`}>
                {new Date(session.registration_deadline).toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Tokyo",
                })}
                {isDeadlinePassed && " (締切済)"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {session.description && (
        <p className="text-sm text-[#475569]">{session.description}</p>
      )}

      {/* Registration status */}
      {myRegistration ? (
        <div className="space-y-3">
          <Card className="border-[#0f8a4f] bg-[#0f8a4f]/5">
            <CardContent className="flex items-center gap-3 p-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <div>
                <p className="font-medium text-[#0f8a4f]">参加登録済み</p>
                <p className="text-xs text-[#475569]">
                  {myRegistration.payment_status === "free"
                    ? "参加費免除（会費会員）"
                    : myRegistration.payment_method === "cash"
                    ? "当日現金払い"
                    : myRegistration.payment_method === "point_card"
                    ? "回数券"
                    : "カード払い"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* キャンセルボタン: 開催後はロック */}
          {canCancel ? (
            <CancelButton sessionId={sessionId} />
          ) : isPast && myRegistration ? (
            <div className="rounded-xl border border-[#dce3ea] bg-[#f2f7fa] p-3 text-center text-xs text-[#64748b]">
              開催日を過ぎたためキャンセルできません
            </div>
          ) : null}
        </div>
      ) : canRegister ? (
        <RegisterButton
          sessionId={sessionId}
          allowPointCard={session.allow_point_card || false}
          isCompetition={isCompetition}
          competitionFields={competitionFields}
          isExempt={isExempt}
          hasCard={hasCard}
        />
      ) : (
        <div className="rounded-xl border border-[#dce3ea] bg-[#f2f7fa] p-4 text-center text-sm text-[#475569]">
          {session.session_status === "cancelled"
            ? "このセッションは中止になりました"
            : isFull
            ? "定員に達しました"
            : isDeadlinePassed
            ? "申込期限を過ぎています"
            : "参加受付終了"}
        </div>
      )}

      {/* 参加者ごとの支払いステータス（管理者のみ） */}
      {isAdmin && (
        <Card className="border-[#dce3ea]">
          <CardContent className="p-0">
            <h2 className="px-4 pt-4 text-sm font-semibold text-[#1a2332]">
              参加者（{participants.length}人）
            </h2>
            {participants.length === 0 ? (
              <p className="px-4 py-4 text-sm text-[#475569]">まだ参加登録がありません</p>
            ) : (
              <div className="mt-2 divide-y divide-[#f2f7fa]">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1a2332]">
                        {p.swimmer?.name ?? "不明"}
                      </p>
                      {p.payment_method && PARTICIPANT_METHOD_LABELS[p.payment_method] && (
                        <p className="text-xs text-[#64748b]">
                          {PARTICIPANT_METHOD_LABELS[p.payment_method]}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        PARTICIPANT_STATUS_STYLES[p.payment_status] ?? "bg-[#edf0f4] text-[#475569]"
                      }`}
                    >
                      {PARTICIPANT_STATUS_LABELS[p.payment_status] ?? p.payment_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {session.content && (
        <Card className="border-[#dce3ea]">
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-[#1a2332]">練習メニュー</h2>
            <pre className="whitespace-pre-wrap text-sm text-[#475569]">{session.content}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
