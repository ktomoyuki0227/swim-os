import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // profileが存在しない場合はサインアウトしてログインへ（親layoutと同じ挙動）
  if (!profile) {
    await supabase.auth.signOut()
    redirect("/login")
  }

  if (profile.role !== "instructor") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
