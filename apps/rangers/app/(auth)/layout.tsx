import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-sky-50">
      {/* ミニヘッダー */}
      <header className="border-b bg-white px-6 py-4">
        <Link href="/" className="text-lg font-bold text-blue-600">
          Rangers
        </Link>
      </header>
      <div className="flex min-h-[calc(100vh-57px)] items-start justify-center px-4 py-10">
        {children}
      </div>
    </div>
  )
}
