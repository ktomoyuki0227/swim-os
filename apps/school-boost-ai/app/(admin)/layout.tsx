import { Sidebar } from '@/components/layout/sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[oklch(0.975_0.004_240)]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
