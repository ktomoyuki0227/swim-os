import { createClient } from "@/lib/supabase/server"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <PublicHeader user={user} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
