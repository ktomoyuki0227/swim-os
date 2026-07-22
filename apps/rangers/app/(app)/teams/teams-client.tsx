"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

type FilterType = "all" | "team" | "personal"
type Team = Record<string, unknown>

function TeamCard({ team }: { team: Team }) {
  const isAdmin = team.my_role === "admin"
  const avatarUrl = team.avatar_url as string | null
  const teamName = team.name as string

  return (
    <Link href={`/teams/${team.id}`} className="block">
      <div className="overflow-hidden rounded-[14px] border border-[#dce3ea] bg-white transition-all hover:border-[#005F8C] hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="relative aspect-square w-full overflow-hidden bg-[#005F8C]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={teamName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {teamName?.[0] || "T"}
            </div>
          )}
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.85)", color: isAdmin ? "#005F8C" : "#475569" }}
          >
            {isAdmin ? "管理者" : "メンバー"}
          </span>
        </div>
        <div className="px-3 py-2.5">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#1a2332]">{teamName}</p>
          {team.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#475569]">
              {team.description as string}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function TeamGrid({ teams }: { teams: Team[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {teams.map((team) => (
        <TeamCard key={team.id as string} team={team} />
      ))}
    </div>
  )
}

interface TeamsClientProps {
  teams: Team[]
}

export function TeamsClient({ teams }: TeamsClientProps) {
  const [filter, setFilter] = useState<FilterType>("all")

  const teamGroups = teams.filter((t) => t.team_type !== "personal")
  const personalGroups = teams.filter((t) => t.team_type === "personal")
  const hasBoth = teamGroups.length > 0 && personalGroups.length > 0

  const filteredTeams = filter === "team" ? teamGroups : filter === "personal" ? personalGroups : null

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold leading-[1.4] text-[#1a2332]">グループ</h1>
        <div className="flex items-center gap-2">
          {/* フィルタープルダウン */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="appearance-none rounded-full border border-[#dce3ea] bg-white py-1.5 pl-3 pr-7 text-sm font-medium text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#005F8C]"
              style={{ minHeight: 36 }}
            >
              <option value="all">すべて</option>
              <option value="team">チーム</option>
              <option value="personal">パーソナル</option>
            </select>
            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#64748b" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <Link
            href="/teams/new"
            className="inline-flex items-center rounded-full bg-[#005F8C] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
            style={{ minHeight: 40 }}
          >
            ＋ 新規作成
          </Link>
        </div>
      </div>

      {/* すべて表示（チーム → 区切り線 → パーソナル） */}
      {filter === "all" && (
        <div className="space-y-4">
          {teamGroups.length > 0 && (
            <div className="space-y-2.5">
              {hasBoth && (
                <p className="text-xs font-semibold tracking-wide text-[#64748b]">チーム</p>
              )}
              <TeamGrid teams={teamGroups} />
            </div>
          )}
          {hasBoth && <hr className="border-[#dce3ea]" />}
          {personalGroups.length > 0 && (
            <div className="space-y-2.5">
              {hasBoth && (
                <p className="text-xs font-semibold tracking-wide text-[#64748b]">パーソナル</p>
              )}
              <TeamGrid teams={personalGroups} />
            </div>
          )}
        </div>
      )}

      {/* チーム / パーソナル 絞り込み表示 */}
      {filter !== "all" && (
        filteredTeams && filteredTeams.length > 0 ? (
          <TeamGrid teams={filteredTeams} />
        ) : (
          <p className="py-8 text-center text-sm text-[#64748b]">
            {filter === "team" ? "チームグループがありません" : "パーソナルグループがありません"}
          </p>
        )
      )}
    </div>
  )
}
