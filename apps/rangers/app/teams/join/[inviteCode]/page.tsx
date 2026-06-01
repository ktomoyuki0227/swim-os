"use client"

import { useState, useTransition, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { joinTeamByCode } from "@/actions/teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToastProvider, useToast } from "@/components/toast"

const SYSTEM_TAGS = [
  { id: "level_beginner", label: "初級", category: "レベル" },
  { id: "level_intermediate", label: "中級", category: "レベル" },
  { id: "level_advanced", label: "上級", category: "レベル" },
  { id: "stroke_freestyle", label: "クロール", category: "種目" },
  { id: "stroke_backstroke", label: "背泳ぎ", category: "種目" },
  { id: "stroke_breaststroke", label: "平泳ぎ", category: "種目" },
  { id: "stroke_butterfly", label: "バタフライ", category: "種目" },
  { id: "stroke_medley", label: "個人メドレー", category: "種目" },
  { id: "purpose_health", label: "健康・趣味", category: "目的" },
  { id: "purpose_competitive", label: "競技", category: "目的" },
]

const LEVEL_TAGS = ["level_beginner", "level_intermediate", "level_advanced"]
const LEVEL_LABELS: Record<string, string> = {
  level_beginner: "初級",
  level_intermediate: "中級",
  level_advanced: "上級",
}

interface JoinPageProps {
  params: Promise<{ inviteCode: string }>
}

function JoinForm({ inviteCode }: { inviteCode: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [membershipType, setMembershipType] = useState<"regular" | "point_card">("regular")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedStrokes, setSelectedStrokes] = useState<string[]>([])
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([])
  const { showToast } = useToast()

  const handleJoin = () => {
    if (!selectedLevel) {
      showToast("レベルを選択してください", "error")
      return
    }

    const tags = [selectedLevel, ...selectedStrokes, ...selectedPurposes]

    startTransition(async () => {
      const result = await joinTeamByCode(inviteCode, membershipType, tags)
      if (result.error) {
        showToast(result.error, "error")
      } else if (result.data) {
        router.push(`/teams/${result.data.id}`)
      }
    })
  }

  const toggleStroke = (id: string) =>
    setSelectedStrokes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  const togglePurpose = (id: string) =>
    setSelectedPurposes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f7fa] px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005F8C]">
            <span className="text-xl font-bold text-white">R</span>
          </div>
          <h1 className="text-xl font-bold text-[#1a2332]">チームに参加</h1>
          <p className="mt-1 text-sm text-[#5c6a7a]">あなたの情報を教えてください</p>
        </div>

        {/* 会員種別 */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#1a2332]">会員種別</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              type="button"
              onClick={() => setMembershipType("regular")}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                membershipType === "regular"
                  ? "border-[#005F8C] bg-[#005F8C]/5"
                  : "border-[#dce3ea] hover:border-[#005F8C]/40"
              }`}
            >
              <div className={`h-4 w-4 rounded-full border-2 ${membershipType === "regular" ? "border-[#005F8C] bg-[#005F8C]" : "border-[#dce3ea]"}`} />
              <div>
                <p className="text-sm font-medium text-[#1a2332]">レギュラー会員</p>
                <p className="text-xs text-[#5c6a7a]">毎月/毎年の会費を支払い</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMembershipType("point_card")}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                membershipType === "point_card"
                  ? "border-[#E8614D] bg-[#E8614D]/5"
                  : "border-[#dce3ea] hover:border-[#E8614D]/40"
              }`}
            >
              <div className={`h-4 w-4 rounded-full border-2 ${membershipType === "point_card" ? "border-[#E8614D] bg-[#E8614D]" : "border-[#dce3ea]"}`} />
              <div>
                <p className="text-sm font-medium text-[#1a2332]">回数券会員</p>
                <p className="text-xs text-[#5c6a7a]">スタンプカードでセッション参加</p>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* レベル（1つ選択） */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#1a2332]">
              レベル <span className="text-[#E8614D]">*</span>
            </CardTitle>
            <p className="text-xs text-[#5c6a7a]">1つ選択してください</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {LEVEL_TAGS.map((tagId) => (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => setSelectedLevel(tagId)}
                  className={`flex-1 rounded-xl border-2 py-2 text-sm font-medium transition-all ${
                    selectedLevel === tagId
                      ? "border-[#005F8C] bg-[#005F8C] text-white"
                      : "border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]/40"
                  }`}
                >
                  {LEVEL_LABELS[tagId]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 種目（複数選択可） */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#1a2332]">種目</CardTitle>
            <p className="text-xs text-[#5c6a7a]">複数選択可</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_TAGS.filter((t) => t.category === "種目").map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleStroke(tag.id)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                    selectedStrokes.includes(tag.id)
                      ? "bg-[#005F8C] text-white"
                      : "border border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]/40"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 目的（複数選択可） */}
        <Card className="border-[#dce3ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#1a2332]">目的</CardTitle>
            <p className="text-xs text-[#5c6a7a]">複数選択可</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_TAGS.filter((t) => t.category === "目的").map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => togglePurpose(tag.id)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                    selectedPurposes.includes(tag.id)
                      ? "bg-[#005F8C] text-white"
                      : "border border-[#dce3ea] text-[#5c6a7a] hover:border-[#005F8C]/40"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleJoin}
          disabled={isPending}
          className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73]"
          style={{ minHeight: "52px", fontSize: "16px" }}
        >
          {isPending ? "参加中..." : "チームに参加する"}
        </Button>
      </div>
    </div>
  )
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { inviteCode } = await params
  return (
    <ToastProvider>
      <Suspense>
        <JoinForm inviteCode={inviteCode} />
      </Suspense>
    </ToastProvider>
  )
}
