import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MessageCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "メッセージ",
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 自分が関わった全メッセージから会話相手一覧を取得
  const { data: sentMessages } = await supabase
    .from("messages")
    .select("receiver_id, created_at, content")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })

  const { data: receivedMessages } = await supabase
    .from("messages")
    .select("sender_id, created_at, content, read_at")
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false })

  // 会話相手のIDを重複なく収集
  const partnerIds = new Set<string>()
  sentMessages?.forEach((m) => partnerIds.add(m.receiver_id))
  receivedMessages?.forEach((m) => partnerIds.add(m.sender_id))

  if (partnerIds.size === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-lg font-semibold text-[#1a2332]">メッセージ</h1>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
            <MessageCircle className="h-6 w-6 text-[#64748b]" />
          </div>
          <p className="text-base font-semibold text-[#1a2332]">まだメッセージはありません</p>
          <p className="text-sm text-[#475569]">
            グループ管理者からのメッセージがここに表示されます
          </p>
        </div>
      </div>
    )
  }

  // パートナーのプロフィール取得
  const { data: partners } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", [...partnerIds])

  // 未読数（自分宛て）
  const unreadCounts: Record<string, number> = {}
  receivedMessages?.forEach((m) => {
    if (!m.read_at) {
      unreadCounts[m.sender_id] = (unreadCounts[m.sender_id] ?? 0) + 1
    }
  })

  // 最新メッセージ
  const latestMessages: Record<string, { content: string; created_at: string }> = {}
  const allMsgs = [
    ...(sentMessages?.map((m) => ({ partnerId: m.receiver_id, content: m.content, created_at: m.created_at })) ?? []),
    ...(receivedMessages?.map((m) => ({ partnerId: m.sender_id, content: m.content, created_at: m.created_at })) ?? []),
  ]
  allMsgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  allMsgs.forEach((m) => {
    if (!latestMessages[m.partnerId]) latestMessages[m.partnerId] = m
  })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-[#1a2332]">メッセージ</h1>
      <div className="divide-y divide-[#e8edf2] rounded-[14px] border border-[#dce3ea] bg-white">
        {(partners ?? []).map((partner) => (
          <Link key={partner.id} href={`/messages/${partner.id}`}>
            <div className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[#f2f7fa]">
              {partner.avatar_url ? (
                <Image
                  src={partner.avatar_url}
                  alt={partner.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#005F8C]/10 font-semibold text-[#005F8C]">
                  {partner.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#1a2332]">{partner.name}</p>
                  {latestMessages[partner.id] && (
                    <p className="text-xs text-[#64748b]">
                      {new Date(latestMessages[partner.id].created_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>
                {latestMessages[partner.id] && (
                  <p className="truncate text-sm text-[#475569]">
                    {latestMessages[partner.id].content}
                  </p>
                )}
              </div>
              {(unreadCounts[partner.id] ?? 0) > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#005F8C] text-xs font-bold text-white">
                  {unreadCounts[partner.id]}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
