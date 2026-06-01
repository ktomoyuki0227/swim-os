import Link from "next/link"
import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f2f7fa]">
      <header className="sticky top-0 z-10 border-b border-[#dce3ea] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="flex items-center gap-1.5">
            <Image src="/rangers-logo-背景透過.png" alt="Rangers" width={40} height={40} className="object-contain" />
            <span className="text-base font-bold text-[#1a2332]">Rangers</span>
          </Link>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-64px)] items-start justify-center px-4 py-10">
        {children}
      </div>
    </div>
  )
}
