"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { messageSchema } from "@/lib/validations"
import { isRateLimited } from "@/lib/rate-limit"

const MESSAGE_RATE_LIMIT = 20
const MESSAGE_RATE_WINDOW_MS = 60 * 1000

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  if (isRateLimited(`send_message:${user.id}`, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW_MS)) {
    return { error: "メッセージの送信が多すぎます。しばらく時間をおいてから再度お試しください" }
  }

  const parsed = messageSchema.safeParse({
    receiver_id: formData.get("receiver_id"),
    content: (formData.get("content") as string)?.trim(),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("・") }
  }
  const { receiver_id: receiverId, content } = parsed.data

  // 送受信者が同じチームに所属しているか確認する（無関係な相手への無制限送信を防ぐ）
  const { data: senderMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("swimmer_id", user.id)
    .eq("status", "active")
  const senderTeamIds = (senderMemberships || []).map((m) => m.team_id)

  const { data: sharedMembership } = senderTeamIds.length > 0
    ? await supabase
        .from("team_members")
        .select("team_id")
        .eq("swimmer_id", receiverId)
        .eq("status", "active")
        .in("team_id", senderTeamIds)
        .limit(1)
        .maybeSingle()
    : { data: null }

  if (!sharedMembership) {
    return { error: "同じグループのメンバーにのみメッセージを送信できます" }
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content,
  })

  if (error) {
    return { error: "送信に失敗しました" }
  }

  revalidatePath(`/messages/${receiverId}`)

  return { success: true }
}

export async function markMessagesRead(senderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("receiver_id", user.id)
    .is("read_at", null)

  revalidatePath("/messages")
  revalidatePath(`/messages/${senderId}`)
}
