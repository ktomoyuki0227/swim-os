import Image from "next/image"
import Link from "next/link"

interface PublicSession {
  id: unknown
  title: unknown
  scheduled_at: unknown
  location: unknown
  member_price: unknown
  type: unknown
}

interface PublicTeamData {
  team: {
    id: string
    name: string
    description: string | null
    avatar_url: string | null
    cover_image_url: string | null
    is_recruiting: boolean
    activity_area: string | null
    invite_code: string
  }
  coach: Record<string, unknown> | null
  memberCount: number
  sessions: PublicSession[]
}

interface PublicTeamViewProps {
  data: PublicTeamData
  /** (app)レイアウトのボトムナビ分 (h-16=64px) を考慮するか */
  hasBottomNav?: boolean
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

export function PublicTeamView({ data, hasBottomNav = false }: PublicTeamViewProps) {
  const { team, coach, memberCount, sessions } = data

  const coachName = (coach?.name as string) ?? null
  const coachAvatarUrl = (coach?.avatar_url as string) ?? null
  const coachCareer = (coach?.career as string) ?? null
  const coachPrefecture = (coach?.prefectures as string[] | undefined)?.[0] ?? null
  const coachBio = (coach?.bio as string) ?? null

  const heroBannerUrl = team.cover_image_url ?? team.avatar_url ?? null
  const activityArea = team.activity_area ?? coachPrefecture ?? null

  const ctaBottom = hasBottomNav ? "bottom-16" : "bottom-4"

  return (
    <div className="min-h-screen bg-[#f5f8fa]">
      {/* ── ヒーロー ── */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        {heroBannerUrl ? (
          <Image
            src={heroBannerUrl}
            alt={team.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#005F8C] via-[#0077b3] to-[#00a8d6]">
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
      <div className="mx-auto max-w-lg px-4 pb-40">
        {/* グループ説明 headline */}
        {team.description && (
          <div className="py-5">
            <p className="text-[22px] font-bold leading-snug text-[#1a2332]">
              {team.description}
            </p>
          </div>
        )}

        {/* ── グループプロフィールカード ── */}
        <div className="rounded-2xl bg-white px-5 py-6 shadow-sm">
          <div className="flex gap-4">
            {/* グループアバター */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#dce3ea] bg-[#e8f2f8]">
              {team.avatar_url ? (
                <Image src={team.avatar_url} alt={team.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">🏊</div>
              )}
            </div>

            {/* 情報 */}
            <div className="min-w-0 flex-1">
              {team.is_recruiting && (
                <div className="mb-1.5">
                  <span className="inline-block rounded-full bg-[#f59e0b] px-2.5 py-0.5 text-xs font-semibold text-white">
                    メンバー募集中
                  </span>
                </div>
              )}
              {coachCareer && (
                <p className="text-xs text-[#5c6a7a]">{coachCareer}</p>
              )}
              <h1 className="mt-0.5 text-xl font-bold text-[#1a2332]">{team.name}</h1>
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-base">👥</span>
                <span className="text-sm font-semibold text-[#1a2332]">{memberCount}</span>
                <span className="text-xs text-[#5c6a7a]">人のメンバー</span>
              </div>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="mt-5 space-y-3">
            {activityArea && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#5c6a7a]">
                  活動エリア
                </span>
                <p className="text-sm text-[#1a2332]">{activityArea}</p>
              </div>
            )}
            {coachBio && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-md border border-[#dce3ea] px-2 py-0.5 text-xs text-[#5c6a7a]">
                  グループ紹介
                </span>
                <p className="text-sm leading-relaxed text-[#1a2332]">{coachBio}</p>
              </div>
            )}
          </div>

          {/* コーチ情報 */}
          {coachName && (
            <div className="mt-5 border-t border-[#f0f3f7] pt-4">
              <p className="mb-2 text-xs font-medium text-[#8d99a8]">管理者・コーチ</p>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dce3ea]">
                  {coachAvatarUrl ? (
                    <Image src={coachAvatarUrl} alt={coachName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#005F8C]">
                      {coachName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2332]">{coachName}</p>
                  {coachCareer && (
                    <p className="text-xs text-[#8d99a8]">{coachCareer}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 直近のセッション ── */}
        {sessions.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-bold text-[#1a2332]">直近のセッション</h2>
            <div className="space-y-2.5">
              {sessions.map((session) => {
                const date = new Date(session.scheduled_at as string)
                return (
                  <div
                    key={session.id as string}
                    className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                  >
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-[#005F8C]/10 py-2">
                      <span className="text-[10px] font-medium text-[#005F8C]">
                        {date.toLocaleDateString("ja-JP", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold leading-tight text-[#005F8C]">
                        {date.getDate()}
                      </span>
                      <span className="text-[10px] text-[#005F8C]">
                        {date.toLocaleDateString("ja-JP", { weekday: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#1a2332]">{session.title as string}</p>
                      <p className="text-xs text-[#5c6a7a]">
                        {date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        {session.location ? ` · ${session.location as string}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full bg-[#e8f2f8] px-2 py-0.5 text-[10px] font-medium text-[#005F8C]">
                        {SESSION_TYPE_LABEL[session.type as string] ?? (session.type as string)}
                      </span>
                      <span className="text-xs font-semibold text-[#1a2332]">
                        ¥{((session.member_price as number) || 0).toLocaleString()}〜
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white px-4 py-8 text-center shadow-sm">
            <p className="text-sm text-[#8d99a8]">現在公開中のセッションはありません</p>
          </div>
        )}
      </div>

      {/* ── 固定 CTA ── */}
      <div className={`fixed ${ctaBottom} left-0 right-0 z-10 px-4 pb-2`}>
        <div className="mx-auto max-w-lg">
          <Link
            href={`/teams/${team.id}/join`}
            className="flex w-full items-center justify-center rounded-full bg-[#005F8C] py-3.5 text-base font-bold text-white shadow-lg transition-colors hover:bg-[#004a6b] active:scale-[0.98]"
            style={{ minHeight: "52px" }}
          >
            このグループに参加する
          </Link>
        </div>
      </div>
    </div>
  )
}
