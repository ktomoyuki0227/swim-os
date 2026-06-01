import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f2f7fa]">
      <header className="sticky top-0 z-10 border-b border-[#dce3ea] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#005F8C]">
              <span className="text-sm font-bold text-white">R</span>
            </div>
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
