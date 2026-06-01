import Link from "next/link"
import { getPublicSessions } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "./search-bar"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  event: "イベント",
  meeting: "ミーティング",
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; location?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const location = params.location || ""

  const { data: sessions } = await getPublicSessions({
    location: location || undefined,
    from: new Date().toISOString(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2332]">レッスンを探す</h1>
        <p className="mt-1 text-sm text-[#5c6a7a]">公開されているセッションに参加できます</p>
      </div>

      {/* Search bar */}
      <SearchBar defaultValue={location} />

      {/* Results */}
      {!sessions || sessions.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="mt-3 text-sm text-[#5c6a7a]">公開セッションが見つかりませんでした</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#5c6a7a]">{sessions.length}件のセッション</p>
          {sessions.map((session: Record<string, unknown>) => {
            const team = session.team as Record<string, unknown> | null
            return (
              <Card key={session.id as string} className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[#005F8C]/10 py-2">
                    <span className="text-[10px] font-medium text-[#005F8C]">
                      {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { month: "short" })}
                    </span>
                    <span className="text-xl font-bold leading-tight text-[#005F8C]">
                      {new Date(session.scheduled_at as string).getDate()}
                    </span>
                    <span className="text-[10px] text-[#005F8C]">
                      {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { weekday: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                      <Badge className="bg-[#edf0f4] text-[#5c6a7a] border-transparent text-[10px]">
                        {SESSION_TYPE_LABELS[session.type as string] || session.type as string}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#5c6a7a]">
                      {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {session.location ? ` · ${session.location as string}` : ""}
                    </p>
                    {team && (
                      <p className="text-xs text-[#8d99a8]">{team.name as string}</p>
                    )}
                    <p className="mt-0.5 text-sm font-semibold text-[#005F8C]">
                      ¥{(session.guest_price as number || 0).toLocaleString()}
                      <span className="text-xs font-normal text-[#8d99a8]">（ゲスト）</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
