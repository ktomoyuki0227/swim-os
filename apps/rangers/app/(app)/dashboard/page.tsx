import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "マイページ" }

const roleLabels: Record<string, string> = {
  swimmer: "スイマー",
  instructor: "指導員",
  admin: "管理者",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profile?.role === "instructor") redirect("/instructor/dashboard")

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*, lesson:lessons(*)")
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  const now = new Date().toISOString()
  const pendingBookings = (allBookings ?? []).filter(
    (b) => (b.status === "confirmed" || b.status === "pending") && b.lesson?.scheduled_at > now
  )
  const pastBookings = (allBookings ?? []).filter(
    (b) => b.status === "completed" || (b.lesson?.scheduled_at ?? "") < now
  )
  const reviewPending = pastBookings.filter(
    (b) => b.status === "completed" && !b.review_submitted
  )

  const { data: unreadMessages } = await supabase
    .from("messages")
    .select("id", { count: "exact" })
    .eq("recipient_id", user.id)
    .eq("is_read", false)

  const unreadCount = unreadMessages?.length ?? 0

  const initials = (profile?.name ?? "")
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const menuLinks = [
    { href: "/instructors", label: "コーチを探す" },
    { href: "/lessons", label: "レッスン一覧" },
    { href: "/bookings", label: "予約履歴（個人指導）" },
    { href: "/messages", label: "メッセージ" },
    { href: "/profile", label: "プロフィール編集" },
  ]

  return (
    <div className="-mx-4 -mt-6 bg-sky-50 pb-16">
      {/* ページタイトル */}
      <div className="bg-sky-50 px-4 pt-8 pb-2 text-center">
        <h1 className="text-2xl font-bold text-blue-500">マイページ</h1>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* ユーザーカード */}
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm text-center">
          <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full ring-2 ring-blue-100">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-100 text-2xl font-bold text-blue-600">
                {initials || "?"}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-lg font-bold">{profile?.name ?? ""} さん</p>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {roleLabels[profile?.role ?? "swimmer"]}
            </span>
          </div>
          <Link href="/profile" className="mt-2 inline-block text-xs text-blue-500 hover:underline">
            プロフィールを編集
          </Link>
        </div>

        {/* ステータスグリッド */}
        <div className="grid grid-cols-2 gap-3">
          {/* 予約中のレッスン */}
          <Link href="/bookings" className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="mb-3 text-xs font-medium text-muted-foreground">予約中のレッスン</p>
            <div className="flex items-end justify-between">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">実施前</p>
                <p className="text-2xl font-bold text-blue-500">{pendingBookings.length}</p>
                <p className="text-xs text-muted-foreground">件</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">口コミ待ち</p>
                <p className="text-2xl font-bold">{reviewPending.length}</p>
                <p className="text-xs text-muted-foreground">件</p>
              </div>
              <span className="text-lg text-muted-foreground">›</span>
            </div>
          </Link>

          {/* 未読メッセージ */}
          <Link href="/messages" className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="mb-3 text-xs font-medium text-muted-foreground">未読メッセージ</p>
            <div className="flex items-end justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">件</p>
              </div>
              <span className="text-lg text-muted-foreground">›</span>
            </div>
          </Link>
        </div>

        {/* コーチを探す CTA */}
        <Link
          href="/instructors"
          className="block rounded-2xl bg-blue-500 px-6 py-5 text-white shadow-sm transition-colors hover:bg-blue-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">コーチを探す</p>
              <p className="mt-0.5 text-sm text-blue-100">
                マスターズ水泳の専門コーチが在籍中
              </p>
            </div>
            <span className="text-2xl">🏊</span>
          </div>
        </Link>

        {/* マイページメニュー */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <p className="px-5 py-3.5 text-sm font-bold border-b">マイページメニュー</p>
          <ul>
            {menuLinks.map(({ href, label }, i) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center justify-between px-5 py-3.5 text-sm hover:bg-sky-50 transition-colors ${
                    i < menuLinks.length - 1 ? "border-b" : ""
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-muted-foreground">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 直近の予約 */}
        {pendingBookings.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <p className="text-sm font-bold">直近の予約</p>
              <Link href="/bookings" className="text-xs text-blue-500 hover:underline">
                もっと見る
              </Link>
            </div>
            <ul>
              {pendingBookings.slice(0, 3).map((booking, i) => (
                <li key={booking.id}>
                  <Link
                    href={`/lessons/${booking.lesson?.id}`}
                    className={`flex items-center justify-between px-5 py-4 hover:bg-sky-50 transition-colors ${
                      i < Math.min(pendingBookings.length, 3) - 1 ? "border-b" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{booking.lesson?.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(booking.lesson?.scheduled_at ?? "").toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-muted-foreground">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* コーチリクエスト CTA */}
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-white px-5 py-5">
          <p className="mb-1 font-semibold text-sm">希望のコーチが見つからない場合</p>
          <p className="mb-4 text-xs text-muted-foreground">
            条件を指定してコーチからの提案を待てるリクエスト機能があります。
          </p>
          <Link
            href="/instructors"
            className="inline-block rounded-xl bg-sky-100 px-5 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-sky-200"
          >
            コーチを探してリクエスト ›
          </Link>
        </div>
      </div>
    </div>
  )
}
