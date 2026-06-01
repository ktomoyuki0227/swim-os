export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyNotifications } from "@/actions/notifications"
import { Card, CardContent } from "@/components/ui/card"
import { MarkAllReadButton } from "./mark-all-read-button"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await getMyNotifications()
  const unreadCount = (notifications || []).filter((n: Record<string, unknown>) => !n.is_read).length

  const typeIcons: Record<string, string> = {
    session_confirmed: "✅",
    session_cancelled: "❌",
    deadline_reached: "⏰",
    new_member: "👋",
    announcement: "📢",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a2332]">通知</h1>
        {unreadCount > 0 && (
          <MarkAllReadButton />
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="mt-3 text-sm text-[#5c6a7a]">通知はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(notifications as Record<string, unknown>[]).map((notification) => (
            <Card
              key={notification.id as string}
              className={`border-[#dce3ea] ${!notification.is_read ? "border-l-4 border-l-[#005F8C]" : ""}`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <span className="text-xl">
                  {typeIcons[notification.type as string] || "🔔"}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${notification.is_read ? "text-[#5c6a7a]" : "text-[#1a2332]"}`}>
                    {notification.title as string}
                  </p>
                  {notification.body ? (
                    <p className="mt-0.5 text-xs text-[#5c6a7a]">{notification.body as string}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[#8d99a8]">
                    {new Date(notification.created_at as string).toLocaleDateString("ja-JP", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
