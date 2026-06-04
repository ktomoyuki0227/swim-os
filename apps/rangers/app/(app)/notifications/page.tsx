export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyNotifications } from "@/actions/notifications"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MarkAllReadButton } from "./mark-all-read-button"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await getMyNotifications()
  const unreadCount = (notifications || []).filter((n: Record<string, unknown>) => !n.is_read).length

  const typeIcons: Record<string, React.ReactNode> = {
    session_confirmed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    session_cancelled: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    deadline_reached: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    new_member: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    announcement: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  }

  const defaultIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )

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
                <span className="mt-0.5 shrink-0">
                  {typeIcons[notification.type as string] ?? defaultIcon}
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
