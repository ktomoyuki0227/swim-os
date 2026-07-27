import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { MessageInput } from "@/components/message/message-input"
import { markMessagesRead } from "@/actions/messages"

interface MessageThreadPageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: MessageThreadPageProps): Promise<Metadata> {
  const { userId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("name").eq("id", userId).single()
  return { title: data ? `${data.name}とのメッセージ` : "メッセージ" }
}

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: partner } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", userId)
    .single()

  if (!partner) notFound()

  // 既読処理とメッセージ取得は互いに独立しているため並列実行する
  const [, { data: messages }] = await Promise.all([
    markMessagesRead(userId),
    supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true }),
  ])

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/messages" className="rounded-md p-1 hover:bg-[#f2f7fa]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {partner.avatar_url ? (
          <Image
            src={partner.avatar_url}
            alt={partner.name}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#005F8C]/10 text-sm font-medium text-[#005F8C]">
            {partner.name[0]}
          </div>
        )}
        <div>
          <p className="font-medium">{partner.name}</p>
          <Link
              href={`/profiles/${partner.id}`}
              className="text-xs text-[#005F8C] hover:underline"
            >
              プロフィールを見る
            </Link>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(messages ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-[#64748b]">
            まだメッセージはありません
          </p>
        )}
        {(messages ?? []).map((msg) => {
          const isMine = msg.sender_id === user.id
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
            >
              {!isMine && (
                partner.avatar_url ? (
                  <Image
                    src={partner.avatar_url}
                    alt={partner.name}
                    width={28}
                    height={28}
                    className="mb-1 rounded-full object-cover"
                  />
                ) : (
                  <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-medium text-[#005F8C]">
                    {partner.name[0]}
                  </div>
                )
              )}
              <div className={`max-w-[72%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? "rounded-br-sm bg-[#005F8C] text-white"
                      : "rounded-bl-sm bg-[#f2f7fa] text-[#1a2332]"
                  }`}
                >
                  {msg.content}
                </div>
                <p className="text-xs text-[#64748b]">
                  {new Date(msg.created_at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 入力エリア */}
      <div className="border-t p-4">
        <MessageInput receiverId={userId} />
      </div>
    </div>
  )
}
