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

const menuLinks = [
  { href: "/bookings", label: "予約履歴（個人指導）" },
  { href: "/messages", label: "メッセージ" },
  { href: "/profile", label: "プロフィール編集" },
  { href: "/lessons", label: "レッスン一覧" },
]

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
  const paymentPending = (allBookings ?? []).filter((b) => b.status === "pending")
  const upcoming = (allBookings ?? []).filter(
    (b) => b.status === "confirmed" && b.lesson?.scheduled_at > now
  )
  const reviewPending = (allBookings ?? []).filter(
    (b) => b.status === "completed" && !b.review_submitted
  )

  const { data: unreadMsgs } = await supabase
    .from("messages")
    .select("id")
    .eq("recipient_id", user.id)
    .eq("is_read", false)
  const unreadCount = unreadMsgs?.length ?? 0

  const hasMission = !profile?.avatar_url

  const initials = (profile?.name ?? "")
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="-mx-4 -mt-6 bg-sky-100 pb-20">
      {/* ページタイトル */}
      <div className="px-4 pb-3 pt-8 text-center">
        <h1 className="text-xl font-bold text-blue-400">マイページ</h1>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 px-3">

        {/* ユーザーカード */}
        <div className="rounded-xl bg-white px-6 py-5 text-center shadow-sm">
          <Link href="/profile" className="inline-block">
            <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full ring-2 ring-sky-200 transition-opacity hover:opacity-80">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src="/images/lp/dashboard-avatar-default.jpg"
                  alt="プロフィール画像"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2">
            <p className="text-lg font-bold">{profile?.name ?? ""} さん</p>
            <span className="rounded bg-orange-400 px-2 py-0.5 text-xs font-bold text-white">
              {roleLabels[profile?.role ?? "swimmer"]}
            </span>
          </div>
        </div>

        {/* ステータスグリッド 上段 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 予約中のレッスン */}
          <Link
            href="/bookings"
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200"
          >
            <p className="mb-3 text-xs font-medium text-gray-700">予約中のレッスン</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">お支払い</span>
                  <span className="mt-0.5 text-base font-bold text-gray-800">{paymentPending.length}
                    <span className="text-xs font-normal">件</span>
                  </span>
                </span>
                <span className="mx-1 text-gray-300">›</span>
                <span className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">実施前</span>
                  <span className="mt-0.5 text-base font-bold text-gray-800">{upcoming.length}
                    <span className="text-xs font-normal">件</span>
                  </span>
                </span>
                <span className="mx-1 text-gray-300">›</span>
                <span className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">口コミ待ち</span>
                  <span className="mt-0.5 text-base font-bold text-gray-800">{reviewPending.length}
                    <span className="text-xs font-normal">件</span>
                  </span>
                </span>
              </div>
              <span className="ml-1 shrink-0 text-gray-300">›</span>
            </div>
          </Link>

          {/* 未読メッセージ */}
          <Link
            href="/messages"
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200"
          >
            <p className="mb-3 text-xs font-medium text-gray-700">未読メッセージ</p>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-800">
                {unreadCount}
                <span className="text-xs font-normal">件</span>
              </span>
              <span className="text-gray-300">›</span>
            </div>
          </Link>
        </div>

        {/* ミッション（未対応タスク） */}
        {hasMission && (
          <Link
            href="/profile"
            className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200"
          >
            <p className="mb-3 text-xs font-medium text-gray-700">ミッション</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs">
                <span className="flex flex-col items-center">
                  <span className="text-gray-500">プロフィール写真</span>
                  <span className="mt-0.5 font-bold text-orange-500">未設定</span>
                </span>
                <span className="mx-2 text-gray-300">›</span>
                <span className="flex flex-col items-center">
                  <span className="text-gray-500">本人確認</span>
                  <span className="mt-0.5 font-bold text-orange-500">未対応</span>
                </span>
              </div>
              <span className="shrink-0 text-gray-300">›</span>
            </div>
          </Link>
        )}

        {/* コーチを探す CTA */}
        <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white px-5 py-5 text-center shadow-sm">
          <p className="mb-1 text-sm font-bold text-gray-800">コーチを探す</p>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex flex-col items-center">
                  <span>コーチ検索中</span>
                  <span className="mt-0.5 text-base font-bold text-gray-800">
                    0<span className="text-xs font-normal">件</span>
                  </span>
                </span>
                <span className="text-gray-300">›</span>
                <span className="flex flex-col items-center">
                  <span>提案あり</span>
                  <span className="mt-0.5 text-base font-bold text-gray-800">
                    0<span className="text-xs font-normal">件</span>
                  </span>
                </span>
              </div>
              <Link
                href="/instructors"
                className="mt-3 block text-center text-xs font-medium text-blue-400 hover:underline"
              >
                コーチを探してリクエストする ›
              </Link>
            </div>
            <div className="ml-4 h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="/images/lp/dashboard-swimmer-cta.jpg"
                alt="コーチを探す"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 下段 2カラム */}
        <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
          {/* マイページメニュー */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <p className="border-b px-4 py-3 text-xs font-bold text-gray-700">マイページメニュー</p>
            <ul>
              {menuLinks.map(({ href, label }, i) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center justify-between px-4 py-3 text-xs text-gray-700 hover:bg-sky-50 ${
                      i < menuLinks.length - 1 ? "border-b" : ""
                    }`}
                  >
                    {label}
                    <span className="text-gray-300">›</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/profile"
                  className="flex items-center justify-between border-t px-4 py-3 text-xs text-gray-700 hover:bg-sky-50"
                >
                  プロフィール編集
                  <span className="text-gray-300">›</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* お気に入りコーチ / 直近レッスン */}
          <div className="space-y-3">
            <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700">お気に入りコーチ</p>
                <Link href="/instructors" className="text-xs text-blue-400 hover:underline">
                  もっと見る
                </Link>
              </div>
              <p className="text-xs text-gray-400">
                まだお気に入りのコーチはいません。
                <Link href="/instructors" className="ml-1 text-blue-400 hover:underline">
                  コーチを探す
                </Link>
              </p>
            </div>

            <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700">直近のレッスン</p>
                <Link href="/bookings" className="text-xs text-blue-400 hover:underline">
                  もっと見る
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400">
                  予定されているレッスンはありません。
                  <Link href="/lessons" className="ml-1 text-blue-400 hover:underline">
                    レッスンを探す
                  </Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.slice(0, 2).map((b) => (
                    <li key={b.id}>
                      <Link href={`/lessons/${b.lesson?.id}`} className="text-xs text-gray-700 hover:text-blue-500">
                        <p className="font-medium">{b.lesson?.title}</p>
                        <p className="text-gray-400">
                          {new Date(b.lesson?.scheduled_at ?? "").toLocaleDateString("ja-JP", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
