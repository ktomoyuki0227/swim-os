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
    .select("name")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#f2f7fa]">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/" className="text-lg font-bold text-[#005F8C]">
          Rangers
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-3 text-5xl font-bold text-[#005F8C]">Thanks!</h1>
          <p className="mb-2 text-lg font-semibold text-[#005F8C]">
            Rangers へようこそ！
          </p>
          <p className="mb-8 text-sm text-[#475569]">
            {profile?.name ?? ""}さんのアカウントが作成されました。
            <br />
            グループに参加するか、自分でグループを作ってはじめましょう。
          </p>

          <div className="mb-8 space-y-3">
            <Link
              href="/teams/new"
              className="block w-full rounded-xl bg-[#005F8C] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#004E73]"
            >
              グループを作る
            </Link>
            <Link
              href="/dashboard"
              className="block w-full rounded-xl border bg-white py-3.5 text-sm font-medium text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
            >
              マイページへ
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 text-left shadow-sm space-y-4">
            <p className="text-sm font-semibold">はじめにやること</p>
            {[
              { num: "1", title: "プロフィールを完成させる", desc: "名前・写真を登録してグループメンバーに顔を覚えてもらいましょう", href: "/profile" },
              { num: "2", title: "グループを探す", desc: "招待リンクからグループに参加できます", href: "/dashboard" },
              { num: "3", title: "グループを作る", desc: "自分でグループを作って練習やイベントを管理しましょう", href: "/teams/new" },
            ].map(({ num, title, desc, href }) => (
              <Link key={num} href={href} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[#e8f2f8]">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-bold text-[#005F8C]">
                  {num}
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-[#475569]">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
