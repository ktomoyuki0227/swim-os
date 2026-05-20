import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "登録完了" }

export default async function OnboardingCompletePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/" className="text-lg font-bold text-blue-600">
          Rangers
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-3 text-5xl font-bold text-blue-400">Thanks!</h1>
          <p className="mb-2 text-lg font-semibold text-blue-500">
            Rangers へようこそ！
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            {profile?.name ?? ""}さんのアカウントが作成されました。
            <br />
            さっそくコーチを探してレッスンを始めましょう。
          </p>

          <div className="mb-8 space-y-3">
            <Link
              href="/instructors"
              className="block w-full rounded-xl bg-blue-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
            >
              コーチを探す
            </Link>
            <Link
              href="/dashboard"
              className="block w-full rounded-xl border bg-white py-3.5 text-sm font-medium text-blue-500 transition-colors hover:bg-sky-50"
            >
              マイページへ
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 text-left shadow-sm space-y-4">
            <p className="text-sm font-semibold">はじめにやること</p>
            {[
              { num: "①", title: "プロフィールを完成させる", desc: "名前・写真を登録してコーチに信頼してもらいましょう", href: "/profile" },
              { num: "②", title: "コーチを探す", desc: "お住まいの地域や得意種目でコーチを検索できます", href: "/instructors" },
              { num: "③", title: "レッスンを予約する", desc: "気になるコーチに日程リクエストを送りましょう", href: "/instructors" },
            ].map(({ num, title, desc, href }) => (
              <Link key={num} href={href} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-sky-50">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  {num.replace("①②③".charAt(0), "").replace("①", "1").replace("②", "2").replace("③", "3")}
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
