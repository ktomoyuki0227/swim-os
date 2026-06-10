import Link from "next/link"
import { notFound } from "next/navigation"
import { getSession, getSessionRegistrations, getPriceViewers } from "@/actions/sessions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SessionActions } from "./session-actions"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "試合",
  event: "イベント",
  meeting: "ミーティング",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "カード",
  cash: "現金",
  point_card: "回数券",
  free: "無料",
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "未払い", className: "bg-[#fdf6e3] text-[#b8860b] border-transparent" },
  paid: { label: "支払済", className: "bg-[#eaf7f0] text-[#0f8a4f] border-transparent" },
  failed: { label: "決済失敗", className: "bg-[#fdecea] text-[#c0392b] border-transparent" },
  refunded: { label: "返金済", className: "bg-[#edf0f4] text-[#5c6a7a] border-transparent" },
  free: { label: "無料", className: "bg-[#edf0f4] text-[#5c6a7a] border-transparent" },
}

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params

  const [sessionResult, registrationsResult, priceViewsResult] = await Promise.all([
    getSession(id),
    getSessionRegistrations(id),
    getPriceViewers(id),
  ])

  if (sessionResult.error || !sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data
  const registrations = (registrationsResult.data || []) as Record<string, unknown>[]
  const priceViews = (priceViewsResult.data || []) as Record<string, unknown>[]
  const team = session.team as Record<string, unknown>
  const isCompetition = session.type === "competition"
  const competitionFields = (session.competition_fields || []) as { key: string; label: string }[]

  const activeRegistrations = registrations.filter((r) => !r.cancelled_at)
  const cancelledRegistrations = registrations.filter((r) => r.cancelled_at)

  const totalRevenue = activeRegistrations
    .filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => {
      const price = r.is_member ? (session.member_price || 0) : (session.guest_price || 0)
      return sum + price
    }, 0)

  const scheduledDate = new Date(session.scheduled_at)
  const isPast = scheduledDate < new Date()

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "受付中", className: "bg-[#e8f2f8] text-[#005F8C] border-transparent" },
    confirmed: { label: "開催確定", className: "bg-[#eaf7f0] text-[#0f8a4f] border-transparent" },
    cancelled: { label: "中止", className: "bg-[#fdecea] text-[#c0392b] border-transparent" },
  }
  const status = statusConfig[session.session_status] ?? statusConfig.open

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/sessions" className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
          ← セッション管理
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1a2332]">{session.title}</h1>
            <p className="text-sm text-[#5c6a7a]">
              {SESSION_TYPE_LABELS[session.type]} · {(team?.name as string) || ""}
            </p>
          </div>
          <Badge className={status.className}>
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Session Info */}
      <Card className="border-[#dce3ea]">
        <CardContent className="divide-y divide-[#dce3ea] p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#5c6a7a]">{session.type === "camp" ? "開始日時" : "日時"}</span>
            <span className="text-sm font-medium text-[#1a2332]">
              {scheduledDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
              {" "}
              {scheduledDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {session.type === "camp" && session.end_at && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#5c6a7a]">終了日時</span>
              <span className="text-sm font-medium text-[#1a2332]">
                {new Date(session.end_at).toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
                {" "}
                {new Date(session.end_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#5c6a7a]">場所</span>
            <span className="text-sm font-medium text-[#1a2332]">{session.location || "未設定"}</span>
          </div>
          {session.meeting_point && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#5c6a7a]">待ち合わせ場所</span>
              <span className="text-sm font-medium text-[#1a2332]">{session.meeting_point}</span>
            </div>
          )}
          {session.gender_filter && session.gender_filter !== "all" && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#5c6a7a]">対象性別</span>
              <span className="text-sm font-medium text-[#1a2332]">
                {session.gender_filter === "male" ? "男性のみ" : "女性のみ"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#5c6a7a]">参加費（メンバー）</span>
            <span className="text-sm font-medium text-[#1a2332]">
              ¥{(session.member_price || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#5c6a7a]">参加費（ゲスト）</span>
            <span className="text-sm font-medium text-[#1a2332]">
              ¥{(session.guest_price || 0).toLocaleString()}
            </span>
          </div>
          {session.registration_deadline && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#5c6a7a]">申込締切</span>
              <span className="text-sm font-medium text-[#1a2332]">
                {new Date(session.registration_deadline).toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Rules / Course Threshold Banner */}
      {session.course_rules && (() => {
        let thresholds: { min?: number; max?: number; courses?: number; cancel_below?: number }[] | null = null
        try {
          const parsed = typeof session.course_rules === "string"
            ? JSON.parse(session.course_rules)
            : session.course_rules
          if (Array.isArray(parsed)) thresholds = parsed
        } catch { /* plain text */ }

        if (thresholds) {
          const count = activeRegistrations.length
          const cancelRule = thresholds.find((r) => r.cancel_below !== undefined)
          const courseRule = thresholds.find((r) =>
            r.min !== undefined && r.max !== undefined &&
            count >= (r.min ?? 0) && count <= (r.max ?? Infinity)
          )
          const isBelowMin = cancelRule && count < (cancelRule.cancel_below ?? 0)
          return (
            <div className={`rounded-xl border px-4 py-3 ${isBelowMin ? "border-[#E8614D]/30 bg-[#E8614D]/5" : "border-[#005F8C]/20 bg-[#005F8C]/5"}`}>
              <p className={`text-xs font-semibold ${isBelowMin ? "text-[#E8614D]" : "text-[#005F8C]"}`}>
                コース判定
              </p>
              <div className="mt-1 flex items-center gap-4">
                <span className={`text-sm font-medium ${isBelowMin ? "text-[#E8614D]" : "text-[#1a2332]"}`}>
                  現在 {count}名 →{" "}
                  {isBelowMin
                    ? `最低催行人数 ${cancelRule!.cancel_below}名 未満（中止検討）`
                    : courseRule
                    ? `${courseRule.courses}コース使用`
                    : "コース数未定義"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {thresholds.filter((r) => r.courses !== undefined).map((r, i) => (
                  <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${count >= (r.min ?? 0) && count <= (r.max ?? Infinity) ? "bg-[#005F8C] text-white" : "bg-[#f2f7fa] text-[#5c6a7a]"}`}>
                    {r.min}〜{r.max}名: {r.courses}コース
                  </span>
                ))}
                {cancelRule && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isBelowMin ? "bg-[#E8614D] text-white" : "bg-[#f2f7fa] text-[#5c6a7a]"}`}>
                    {cancelRule.cancel_below}名未満: 中止
                  </span>
                )}
              </div>
            </div>
          )
        }

        return (
          <div className="rounded-xl border border-[#b8860b]/30 bg-[#fdf6e3] px-4 py-3">
            <div className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-[#b8860b]">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-[#b8860b]">コースルール</p>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-[#b8860b]">{session.course_rules as string}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[#dce3ea]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#005F8C]">{activeRegistrations.length}</p>
            <p className="text-xs text-[#5c6a7a]">参加登録</p>
            {session.max_participants && (
              <p className="text-xs text-[#8d99a8]">/ {session.max_participants}名</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-[#dce3ea]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#005F8C]">
              {activeRegistrations.filter((r) => r.payment_status === "paid").length}
            </p>
            <p className="text-xs text-[#5c6a7a]">支払済み</p>
          </CardContent>
        </Card>
        <Card className="border-[#dce3ea]">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-[#005F8C]">
              ¥{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-[#5c6a7a]">確定収益</p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      {!isPast && session.session_status !== "cancelled" && (
        <SessionActions
          sessionId={id}
          currentStatus={session.session_status}
          hasFailedPayments={activeRegistrations.some((r) => r.payment_status === "failed")}
          failedRegistrationIds={activeRegistrations.filter((r) => r.payment_status === "failed").map((r) => r.id as string)}
          isCompetition={isCompetition}
        />
      )}

      {/* Competition sheet view */}
      {isCompetition && activeRegistrations.length > 0 && competitionFields.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-[#1a2332]">
            エントリー一覧（シート表示）
          </h2>
          <Card className="border-[#dce3ea] overflow-x-auto">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dce3ea] bg-[#f2f7fa]">
                    <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-[#5c6a7a]">名前</th>
                    {competitionFields.map((f) => (
                      <th key={f.key} className="whitespace-nowrap px-3 py-2 text-left font-medium text-[#5c6a7a]">
                        {f.label}
                      </th>
                    ))}
                    <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-[#5c6a7a]">支払</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRegistrations.map((reg) => {
                    const swimmer = reg.swimmer as Record<string, unknown> | null
                    const entry = (reg.competition_entry || {}) as Record<string, unknown>
                    const payStatus = PAYMENT_STATUS_LABELS[reg.payment_status as string] ?? PAYMENT_STATUS_LABELS.pending
                    return (
                      <tr key={reg.id as string} className="border-b border-[#dce3ea] last:border-0">
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-[#1a2332]">
                          {(swimmer?.name as string) || "不明"}
                        </td>
                        {competitionFields.map((f) => (
                          <td key={f.key} className="whitespace-nowrap px-3 py-2 text-[#1a2332]">
                            {String(entry[f.key] || "—")}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-3 py-2">
                          <Badge className={`text-xs ${payStatus.className}`}>
                            {payStatus.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participants list */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-[#1a2332]">
          参加者一覧 ({activeRegistrations.length}名)
        </h2>
        {activeRegistrations.length === 0 ? (
          <Card className="border-[#dce3ea]">
            <CardContent className="py-8 text-center text-sm text-[#5c6a7a]">
              まだ参加登録がありません
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeRegistrations.map((reg) => {
              const swimmer = reg.swimmer as Record<string, unknown> | null
              const payStatus = PAYMENT_STATUS_LABELS[reg.payment_status as string] ?? PAYMENT_STATUS_LABELS.pending
              return (
                <Card key={reg.id as string} className="border-[#dce3ea]">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C]">
                      {(swimmer?.name as string)?.[0] || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1a2332]">
                        {(swimmer?.name as string) || "不明"}
                      </p>
                      <p className="text-xs text-[#5c6a7a]">
                        {reg.is_member ? "メンバー" : "ゲスト"}
                        {" · "}
                        {PAYMENT_METHOD_LABELS[reg.payment_method as string] || reg.payment_method as string}
                      </p>
                    </div>
                    <Badge className={`text-xs ${payStatus.className}`}>
                      {payStatus.label}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancelled */}
      {cancelledRegistrations.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-[#5c6a7a]">
            キャンセル済み ({cancelledRegistrations.length}名)
          </h2>
          <div className="space-y-2 opacity-60">
            {cancelledRegistrations.map((reg) => {
              const swimmer = reg.swimmer as Record<string, unknown> | null
              return (
                <Card key={reg.id as string} className="border-[#dce3ea]">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f7fa] text-xs font-semibold text-[#8d99a8]">
                      {(swimmer?.name as string)?.[0] || "?"}
                    </div>
                    <p className="text-sm text-[#5c6a7a]">
                      {(swimmer?.name as string) || "不明"}
                    </p>
                    <span className="ml-auto text-xs text-[#8d99a8]">キャンセル</span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Price Viewers */}
      {priceViews.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-[#5c6a7a]">
            料金閲覧者 ({priceViews.length}名)
          </h2>
          <Card className="border-[#dce3ea]">
            <CardContent className="divide-y divide-[#dce3ea] p-0">
              {priceViews.map((pv) => {
                const viewer = pv.viewer as Record<string, unknown> | null
                return (
                  <div key={pv.id as string} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8614D]/10 text-[10px] font-semibold text-[#E8614D]">
                        {(viewer?.name as string)?.[0] || "?"}
                      </div>
                      <span className="text-sm text-[#1a2332]">{(viewer?.name as string) || "不明"}</span>
                    </div>
                    <span className="text-xs text-[#8d99a8]">
                      {new Date(pv.viewed_at as string).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {session.content && (
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a2332]">練習メニュー</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-[#1a2332]">{session.content}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
