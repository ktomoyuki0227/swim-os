import Link from "next/link"
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
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-blue-600">
              Rangers
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/instructors"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                コーチを探す
              </Link>
              <Link
                href="/about"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Rangers とは
              </Link>
              <Link
                href="/price"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                料金
              </Link>
              <Link
                href="/faq"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                よくある質問
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  マイページ
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    ログイン
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
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
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="mb-2 font-medium">Rangers</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">Rangers とは</Link></li>
                <li><Link href="/price" className="hover:text-foreground">料金</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">よくある質問</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">サービス</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/instructors" className="hover:text-foreground">コーチを探す</Link></li>
                <li><Link href="/lessons" className="hover:text-foreground">レッスン一覧</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">コーチの方へ</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/register" className="hover:text-foreground">コーチ登録</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <p>© 2025 Rangers — Groove House</p>
            <p>Powered by Groove House</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
