export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyNotifications } from "@/actions/notifications"
import { Card, CardContent } from "@/components/ui/card"
import { MarkAllReadButton } from "./mark-all-read-button"
import { NotificationItem } from "./notification-item"
export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await getMyNotifications()
  const unreadCount = notifications.filter((n) => !n.is_read).length

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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="mt-3 text-sm text-[#5c6a7a]">通知はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  )
}
