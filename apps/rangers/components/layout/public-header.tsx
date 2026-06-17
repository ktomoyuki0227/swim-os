import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface PublicHeaderProps {
  user: { id: string } | null
}

export function PublicHeader({ user }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-[#dce3ea] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/rangers-logo-背景透過.png" alt="Rangers logo" width={40} height={40} className="object-contain" />
          <Image src="/rangers-name-背景透過.png" alt="Rangers" width={110} height={30} className="object-contain" />
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
  )
}
