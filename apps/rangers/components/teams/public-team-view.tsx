import Image from "next/image"
import Link from "next/link"
import { ContactInfoButton } from "./contact-info-button"
import type { SessionType } from "@/types/database"

interface PublicSession {
  id: string
  title: string
  scheduled_at: string
  location: string | null
  member_price: number
  guest_price: number
  type: SessionType
}

interface PublicTeamData {
  team: {
    id: string
    name: string
    description: string | null
    avatar_url: string | null
    cover_image_url: string | null
    is_recruiting: boolean
    show_member_count: boolean
    activity_area: string | null
    practice_frequency: string | null
    practice_days: string[]
    main_pool: string | null
    contact_email: string | null
    contact_phone: string | null
  }
  coach: Record<string, unknown> | null
  memberCount: number
  sessions: PublicSession[]
}

interface PublicTeamViewProps {
  data: PublicTeamData
  /** (app)レイアウトのボトムナビ分 (h-16=64px) を考慮するか */
  hasBottomNav?: boolean
  /** ログイン済み非メンバーの参加申請状況 */
  joinRequestStatus?: "pending" | "approved" | "rejected" | null
  /** ログイン状態（問い合わせボタンの表示制御に使用） */
  isLoggedIn?: boolean
  /** 管理者がプレビュー表示している場合は true（参加CTAを非表示にする） */
  isAdmin?: boolean
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

export function PublicTeamView({ data, hasBottomNav = false, joinRequestStatus = null, isLoggedIn = false, isAdmin = false }: PublicTeamViewProps) {
  const { team, coach, memberCount, sessions } = data

  const coachId = (coach?.id as string) ?? null
  const coachName = (coach?.name as string) ?? null
  const coachAvatarUrl = (coach?.avatar_url as string) ?? null
  const coachCareer = (coach?.career as string) ?? null
  const coachPrefecture = (coach?.prefectures as string[] | undefined)?.[0] ?? null
  const coachBio = (coach?.bio as string) ?? null

  const heroBannerUrl = team.cover_image_url ?? team.avatar_url ?? null
  const activityArea = team.activity_area ?? coachPrefecture ?? null

  const ctaBottom = hasBottomNav ? "bottom-16" : "bottom-4"

  return (
    <div className="min-h-screen bg-[#f2f7fa]">
      {/* ── ヒーロー ── */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        {heroBannerUrl ? (
          <Image
            src={heroBannerUrl}
            alt={team.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#005F8C] via-[#005F8C] to-[#5BC0EB]">
            <div className="absolute inset-0 opacity-20">
              {[40, 55, 70].map((size, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                  style={{ width: `${size}%`, height: `${size}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl">🏊</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* ── コンテンツ ── */}
      {/* CTA 1ボタン分の高さ(~60px) + 位置オフセット分のパディング */}
      <div className={`mx-auto max-w-lg px-4 ${isAdmin ? "pb-8" : hasBottomNav ? "pb-36" : "pb-28"}`}>
        {/* チーム名 + 問い合わせアイコン */}
        <div className="flex items-center justify-between pt-4 pb-1">
          <h1 className="text-xl font-bold text-[#1a2332]">{team.name}</h1>
          {(team.contact_email || team.contact_phone) && (
            <ContactInfoButton
              teamId={team.id}
              contactEmail={team.contact_email}
              contactPhone={team.contact_phone}
              isLoggedIn={isLoggedIn ?? false}
            />
          )}
        </div>

        {/* グループ説明 */}
        {team.description && (
          <p className="pb-4 text-sm text-[#475569]">
            {team.description}
          </p>
        )}

        {/* ── グループプロフィールカード ── */}
        <div className="rounded-2xl bg-white px-5 py-6 shadow-sm">
          <div className="flex gap-4">
            {/* グループアバター */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#dce3ea] bg-[#e8f2f8]">
              {team.avatar_url ? (
                <Image src={team.avatar_url} alt={team.name} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">🏊</div>
              )}
            </div>

            {/* 情報 */}
            <div className="min-w-0 flex-1">
              {team.is_recruiting && (
                <div className="mb-1.5">
                  <span className="inline-block rounded-full bg-[#d97706] px-2.5 py-0.5 text-xs font-semibold text-white">
                    メンバー募集中
                  </span>
                </div>
              )}
              {coachCareer && (
                <p className="text-xs text-[#475569]">{coachCareer}</p>
              )}
              {team.show_member_count && (
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="text-base">👥</span>
                  <span className="text-sm font-semibold text-[#1a2332]">{memberCount}</span>
                  <span className="text-xs text-[#475569]">人のメンバー</span>
                </div>
              )}
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="mt-5 space-y-3">
            {activityArea && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#475569]">
                  活動エリア
                </span>
                <p className="text-sm text-[#1a2332]">{activityArea}</p>
              </div>
            )}
            {team.main_pool && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#475569]">
                  使用プール
                </span>
                <p className="text-sm text-[#1a2332]">{team.main_pool}</p>
              </div>
            )}
            {team.practice_frequency && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#475569]">
                  練習頻度
                </span>
                <p className="text-sm text-[#1a2332]">{team.practice_frequency}</p>
              </div>
            )}
            {team.practice_days && team.practice_days.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#475569]">
                  練習曜日
                </span>
                <div className="flex flex-wrap gap-1">
                  {team.practice_days.map((day) => (
                    <span
                      key={day}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f2f8] text-xs font-medium text-[#005F8C]"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {coachBio && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#475569]">
                  グループ紹介
                </span>
                <p className="text-sm leading-relaxed text-[#1a2332]">{coachBio}</p>
              </div>
            )}
          </div>

          {/* コーチ情報 */}
          {coachName && (
            <div className="mt-5 border-t border-[#e8edf2] pt-4">
              <p className="mb-2 text-xs font-medium text-[#64748b]">管理者・コーチ</p>
              {coachId ? (
                <Link
                  href={`/profiles/${coachId}`}
                  className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-[#f2f7fa]"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dce3ea]">
                    {coachAvatarUrl ? (
                      <Image src={coachAvatarUrl} alt={coachName} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#005F8C]">
                        {coachName[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1a2332]">{coachName}</p>
                    {coachCareer && (
                      <p className="text-xs text-[#64748b]">{coachCareer}</p>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dce3ea]">
                    {coachAvatarUrl ? (
                      <Image src={coachAvatarUrl} alt={coachName} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#005F8C]">
                        {coachName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a2332]">{coachName}</p>
                    {coachCareer && (
                      <p className="text-xs text-[#64748b]">{coachCareer}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 直近のセッション ── */}
        {sessions.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-bold text-[#1a2332]">直近のセッション</h2>
            <div className="space-y-2.5">
              {sessions.map((session) => {
                const date = new Date(session.scheduled_at)
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                  >
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-[#005F8C]/10 py-2">
                      <span className="text-xs font-medium text-[#005F8C]">
                        {date.toLocaleDateString("ja-JP", { month: "short", timeZone: "Asia/Tokyo" })}
                      </span>
                      <span className="text-xl font-bold leading-tight text-[#005F8C]">
                        {parseInt(date.toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }))}
                      </span>
                      <span className="text-xs text-[#005F8C]">
                        {date.toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#1a2332]">{session.title}</p>
                      <p className="text-xs text-[#475569]">
                        {date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
                        {session.location ? ` · ${session.location}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-xs font-medium text-[#005F8C]">
                        {SESSION_TYPE_LABEL[session.type] ?? session.type}
                      </span>
                      <span className="text-xs font-semibold text-[#1a2332]">
                        ¥{(session.member_price || 0).toLocaleString()}〜
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white px-4 py-8 text-center shadow-sm">
            <p className="text-sm text-[#64748b]">現在公開中のセッションはありません</p>
          </div>
        )}
      </div>

      {/* ── 固定 CTA（管理者プレビュー時は非表示） ── */}
      {!isAdmin && <div className={`fixed ${ctaBottom} left-0 right-0 z-10 px-4 pb-2`}>
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {joinRequestStatus === "pending" ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d97706] py-3.5 text-base font-bold text-white shadow-lg" style={{ minHeight: "52px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              参加申請中（承認待ち）
            </div>
          ) : team.is_recruiting ? (
            <Link
              href={`/teams/${team.id}/join`}
              className="flex w-full items-center justify-center rounded-full bg-[#005F8C] py-3.5 text-base font-bold text-white shadow-lg transition-colors hover:bg-[#004E73] active:scale-[0.98]"
              style={{ minHeight: "52px" }}
            >
              このグループに参加する
            </Link>
          ) : (
            <div
              className="flex w-full items-center justify-center rounded-full bg-[#c8d8e8] py-3.5 text-base font-bold text-[#64748b] shadow-lg"
              style={{ minHeight: "52px" }}
            >
              現在メンバーを募集していません
            </div>
          )}
        </div>
      </div>}
    </div>
  )
}
