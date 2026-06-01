import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b border-[#dce3ea] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-1.5">
            <Image src="/rangers-logo-背景透過.png" alt="Rangers" width={40} height={40} className="object-contain" />
            <span className="text-base font-bold text-[#1a2332]">Rangers</span>
          </Link>

          {/* ボタン */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="rounded-full bg-[#005F8C] hover:bg-[#004E73]"
                  style={{ minHeight: "44px" }}
                >
                  マイページ
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-[#5c6a7a] hover:text-[#1a2332]"
                    style={{ minHeight: "44px" }}
                  >
                    ログイン
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="rounded-full bg-[#06C755] hover:bg-[#05b04c]"
                    style={{ minHeight: "44px" }}
                  >
                    無料で始める
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">{children}</main>

      {/* フッター */}
      <footer className="border-t border-[#dce3ea] bg-[#1a2332] py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-6 flex items-center gap-1.5">
            <Image src="/rangers-logo-背景透過.png" alt="Rangers" width={40} height={40} className="object-contain" />
            <span className="font-bold text-white">Rangers</span>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            マスターズ水泳チームのスケジュール管理・参加登録・会費管理をひとつのアプリで。
          </p>
          <div className="border-t border-white/10 pt-6 text-xs text-slate-500">
            © 2025 Rangers — Groove House
          </div>
        </div>
      </footer>
    </div>
  )
}
